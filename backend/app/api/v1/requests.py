"""
Endpoints del portal autenticado (/v1/me/*). Los pedidos públicos viven en
orders.py; la consulta sin cuenta, en POST /v1/track.
"""
from datetime import UTC, datetime, timedelta
from uuid import UUID

from fastapi import APIRouter, File, HTTPException, Request, UploadFile, status
from fastapi.concurrency import run_in_threadpool
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api.deps import DB, CurrentUser, client_ip
from app.api.v1.orders import _s3
from app.core.config import get_settings
from app.domain.request_status import TERMINAL
from app.models import Request as Req, StoredFile, User
from app.schemas.requests import RequestOut
from app.services.audit import audit
from app.services.files import FileRejected, validate_upload

router = APIRouter(tags=["requests"])


async def _own_request(db: DB, user: User, code: str) -> Req:
    r = await db.scalar(
        select(Req)
        .options(selectinload(Req.events), selectinload(Req.service))
        .where(Req.code == code, Req.applicant_id == user.id)  # autorización por propiedad
    )
    if not r:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Solicitud no encontrada")
    return r


@router.get("/me/requests", response_model=list[RequestOut])
async def my_requests(user: CurrentUser, db: DB) -> list[RequestOut]:
    rows = await db.scalars(
        select(Req)
        .options(selectinload(Req.events), selectinload(Req.service))
        .where(Req.applicant_id == user.id)
        .order_by(Req.created_at.desc())
    )
    return [RequestOut.from_model(r) for r in rows]


@router.get("/me/requests/{code}", response_model=RequestOut)
async def my_request(code: str, user: CurrentUser, db: DB) -> RequestOut:
    return RequestOut.from_model(await _own_request(db, user, code))


@router.post("/me/requests/{code}/files", status_code=201)
async def upload_support(code: str, user: CurrentUser, db: DB, request: Request, file: UploadFile = File(...)) -> dict:
    r = await _own_request(db, user, code)
    if r.status in TERMINAL:
        raise HTTPException(status.HTTP_409_CONFLICT, "La solicitud está cerrada")
    s = get_settings()
    content = await file.read(s.max_upload_mb * 1024 * 1024 + 1)
    try:
        v = validate_upload(content, request_code=r.code, max_mb=s.max_upload_mb)
    except FileRejected as e:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, str(e)) from None
    client = _s3()
    await run_in_threadpool(
        client.put_object, Bucket=s.s3_bucket, Key=v.storage_key, Body=content, ContentType=v.mime, ServerSideEncryption="AES256"
    )
    db.add(
        StoredFile(
            request_id=r.id, uploaded_by=user.id, kind="soporte", original_name=(file.filename or "archivo")[:200],
            storage_key=v.storage_key, mime=v.mime, size=v.size, sha256=v.sha256,
        )
    )
    await audit(db, action="file.upload", target_type="request", target_id=r.code, actor_id=user.id, ip=client_ip(request))
    await db.commit()
    return {"ok": True}


@router.get("/me/documents/{file_id}/download")
async def download_document(file_id: UUID, user: CurrentUser, db: DB, request: Request) -> dict:
    f = await db.scalar(
        select(StoredFile).join(Req).where(
            StoredFile.id == file_id, Req.applicant_id == user.id, StoredFile.deleted_at.is_(None)
        )
    )
    if not f:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Documento no disponible")
    s = get_settings()
    client = _s3()
    url = await run_in_threadpool(
        client.generate_presigned_url,
        "get_object",
        Params={"Bucket": s.s3_bucket, "Key": f.storage_key},
        ExpiresIn=s.download_url_seconds,
    )
    await audit(db, action="file.download", target_type="file", target_id=str(f.id), actor_id=user.id, ip=client_ip(request))
    await db.commit()
    return {"url": url, "expires_at": (datetime.now(UTC) + timedelta(seconds=s.download_url_seconds)).isoformat()}
