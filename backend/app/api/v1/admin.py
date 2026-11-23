"""Panel administrativo: pedidos, estados, cotizaciones, documentos y auditoría."""
from datetime import UTC, datetime, timedelta
from typing import Literal
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, Request, UploadFile, status
from fastapi.concurrency import run_in_threadpool
from sqlalchemy import or_, select
from sqlalchemy.orm import selectinload

from app.api.deps import DB, client_ip, require_role
from app.api.v1.orders import _s3
from app.core.config import get_settings
from app.core.security import decrypt_field
from app.domain.request_status import LABELS, TERMINAL, TRANSITIONS, SYSTEM_ONLY, InvalidTransition, RequestStatus, assert_transition, requires_note
from app.models import AuditLog, Order, Quote, Request as Req, RequestEvent, StoredFile, User
from app.models.entities import Role
from app.schemas.requests import QuoteCreate, RequestOut, StatusChange
from app.services.audit import audit
from app.services.files import FileRejected, validate_upload
from app.services.integrations import emit_n8n
from app.services.notify import Notice, notify
from app.services.payments import quote_balance

router = APIRouter(prefix="/admin", tags=["admin"])
Operator = Depends(require_role(Role.OPERATOR))
Admin = Depends(require_role(Role.ADMIN))

VAT_RATE = 0.19  # IVA sobre el honorario de gestión

# Mensaje al cliente para cada estado (se usa en el correo/WhatsApp si el operador no escribe nota)
CLIENT_MESSAGES: dict[RequestStatus, str] = {
    RequestStatus.IN_REVIEW: "Estamos revisando tu solicitud y verificando la disponibilidad con la entidad.",
    RequestStatus.NEEDS_INFO: "Necesitamos un dato o soporte adicional para continuar.",
    RequestStatus.QUOTING: "Confirmamos la información y estamos preparando tu cotización.",
    RequestStatus.IN_PROGRESS: "Radicamos tu solicitud ante la entidad y le hacemos seguimiento.",
    RequestStatus.AWAITING_ENTITY: "Tu solicitud está en manos de la entidad; te avisaremos apenas responda.",
    RequestStatus.DOCUMENT_AVAILABLE: "¡Tu documento está disponible!",
    RequestStatus.DELIVERED: "Entregamos tu documento. Gracias por confiar en NEXODOC.",
    RequestStatus.CLOSED: "Cerramos tu solicitud.",
    RequestStatus.REJECTED_CANCELLED: "Tu solicitud fue rechazada o cancelada.",
}


def notice_for(order: Order, r: Req, message: str) -> Notice:
    return Notice(
        email=order.applicant.email,
        phone=order.phone,
        first_name=order.full_name.split(" ")[0],
        order_code=order.code,
        document=r.service.name if r.service else "Otro documento",
        status_label=LABELS[r.status],
        message=message,
    )


async def _get(db: DB, code: str) -> Req:
    r = await db.scalar(
        select(Req)
        .options(selectinload(Req.events), selectinload(Req.service), selectinload(Req.order).selectinload(Order.applicant))
        .where(Req.code == code)
    )
    if not r:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Solicitud no encontrada")
    return r


# --- Pedidos ---------------------------------------------------------------------
@router.get("/orders")
async def list_orders(
    db: DB,
    status_filter: RequestStatus | None = None,
    q: str | None = None,
    limit: int = 100,
    user: User = Operator,
) -> list[dict]:
    """Pedidos más recientes, filtrables por estado de algún documento o por código/correo/nombre."""
    stmt = (
        select(Order)
        .options(selectinload(Order.applicant), selectinload(Order.payments),
                 selectinload(Order.requests).selectinload(Req.service))
        .order_by(Order.created_at.desc())
        .limit(min(max(limit, 1), 300))
    )
    if status_filter:
        stmt = stmt.where(Order.requests.any(Req.status == status_filter))
    if q and q.strip():
        term = f"%{q.strip()[:80]}%"
        stmt = stmt.join(User, Order.applicant_id == User.id).where(
            or_(Order.code.ilike(term), User.email.ilike(term), Order.full_name.ilike(term))
        )
    rows = await db.scalars(stmt)
    return [
        {
            "code": o.code,
            "created_at": o.created_at.isoformat(),
            "applicant": o.full_name,
            "email": o.applicant.email,
            "city": o.city,
            "verification_total": o.verification_total,
            "verification_paid": any(p.purpose == "verification" and p.status == "approved" for p in o.payments),
            "items": [
                {"code": r.code, "service": r.service.name if r.service else "Otro documento", "status": r.status, "status_label": LABELS[r.status]}
                for r in o.requests
            ],
        }
        for o in rows.unique()
    ]


@router.get("/orders/{code}")
async def order_detail(code: str, request: Request, db: DB, user: User = Operator) -> dict:
    """Detalle completo del pedido, con datos personales. Cada consulta queda en auditoría."""
    o = await db.scalar(
        select(Order).where(Order.code == code).options(
            selectinload(Order.applicant),
            selectinload(Order.payments),
            selectinload(Order.requests).selectinload(Req.service),
            selectinload(Order.requests).selectinload(Req.events),
            selectinload(Order.requests).selectinload(Req.files),
            selectinload(Order.requests).selectinload(Req.order).selectinload(Order.payments),
            selectinload(Order.requests).selectinload(Req.quotes).selectinload(Quote.payments),
        )
    )
    if not o:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Pedido no encontrado")
    await audit(db, action="order.view", target_type="order", target_id=o.code, actor_id=user.id, ip=client_ip(request))
    await db.commit()
    s = get_settings()
    items = []
    for r in o.requests:
        quote = None
        if r.quotes:
            qt = r.quotes[-1]
            credited, paid, due = quote_balance(r, qt, credit_verification=s.credit_verification_fee)
            quote = {"entity_fees": qt.entity_fees, "service_fee": qt.service_fee, "vat_on_service": qt.vat_on_service,
                     "shipping_fee": qt.shipping_fee, "total": qt.total, "credited": credited, "paid": paid, "amount_due": due,
                     "estimated_days_note": qt.estimated_days_note, "valid_until": qt.valid_until.isoformat()}
        next_states = sorted(
            (t for t in TRANSITIONS[r.status] if (r.status, t) not in SYSTEM_ONLY),
            key=lambda t: list(RequestStatus).index(t),
        )
        items.append({
            "code": r.code,
            "service": r.service.name if r.service else "Otro documento",
            "service_slug": (r.details or {}).get("service"),
            "status": r.status,
            "status_label": LABELS[r.status],
            "fields": (r.details or {}).get("fields", {}),
            "verification_fee": r.verification_fee,
            "next_states": [{"code": t, "label": LABELS[t], "requires_note": requires_note(t)} for t in next_states],
            "can_quote": r.status == RequestStatus.QUOTING,
            "events": [{"to_status": e.to_status, "label": LABELS[e.to_status], "note": e.note,
                        "visible_to_client": e.visible_to_client, "system": e.actor_id is None,
                        "created_at": e.created_at.isoformat()} for e in r.events],
            "files": [{"id": str(f.id), "name": f.original_name, "kind": f.kind, "size": f.size, "mime": f.mime,
                       "created_at": f.created_at.isoformat()} for f in r.files if f.deleted_at is None],
            "quote": quote,
        })
    return {
        "code": o.code,
        "created_at": o.created_at.isoformat(),
        "applicant": {
            "type": o.applicant_type, "full_name": o.full_name, "company": o.company, "email": o.applicant.email,
            "phone": o.phone, "city": o.city, "document_type": o.document_type,
            "document_number": decrypt_field(o.document_number_enc),
        },
        "shipping": o.shipping or None,
        "verification_total": o.verification_total,
        "payments": [{"reference": p.reference, "purpose": p.purpose, "amount": p.amount, "status": p.status,
                      "method": p.method, "created_at": p.created_at.isoformat()} for p in o.payments],
        "items": items,
    }


# --- Estados y cotizaciones ----------------------------------------------------------
@router.get("/requests", response_model=list[RequestOut])
async def list_requests(db: DB, status_filter: RequestStatus | None = None, user: User = Operator) -> list[RequestOut]:
    q = select(Req).options(selectinload(Req.events), selectinload(Req.service)).order_by(Req.created_at.desc()).limit(200)
    if status_filter:
        q = q.where(Req.status == status_filter)
    return [RequestOut.from_model(r, client_view=False) for r in await db.scalars(q)]


@router.patch("/requests/{code}/status", response_model=RequestOut)
async def change_status(code: str, body: StatusChange, request: Request, db: DB, tasks: BackgroundTasks, user: User = Operator) -> RequestOut:
    r = await _get(db, code)
    try:
        assert_transition(r.status, body.to)
    except InvalidTransition as e:
        raise HTTPException(status.HTTP_409_CONFLICT, str(e)) from None
    if requires_note(body.to) and not body.note:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Este estado requiere una nota para el cliente")

    previous = r.status
    r.status = body.to
    if body.to in (RequestStatus.CLOSED, RequestStatus.REJECTED_CANCELLED):
        r.closed_at = datetime.now(UTC)
        r.purge_after = r.closed_at + timedelta(days=get_settings().document_retention_days)
    db.add(RequestEvent(request_id=r.id, actor_id=user.id, from_status=previous, to_status=body.to,
                        note=body.note, visible_to_client=body.visible_to_client))
    await audit(db, action="status.change", target_type="request", target_id=r.code, actor_id=user.id,
                ip=client_ip(request), meta={"from": previous.value, "to": body.to.value})
    await db.commit()
    await db.refresh(r, ["events"])
    if body.visible_to_client and r.order is not None:
        message = body.note or CLIENT_MESSAGES.get(body.to, "Tu solicitud cambió de estado.")
        tasks.add_task(notify, notice_for(r.order, r, message))
    await emit_n8n("request.status", {"code": r.code, "from": previous.value, "to": body.to.value})
    return RequestOut.from_model(r, client_view=False)


@router.post("/requests/{code}/quote", status_code=201)
async def create_quote(code: str, body: QuoteCreate, request: Request, db: DB, tasks: BackgroundTasks, user: User = Operator) -> dict:
    r = await _get(db, code)
    if r.status != RequestStatus.QUOTING:
        raise HTTPException(status.HTTP_409_CONFLICT, "La solicitud debe estar «En cotización»")
    quote = Quote(
        request_id=r.id,
        entity_fees=body.entity_fees,
        service_fee=body.service_fee,
        vat_on_service=round(body.service_fee * VAT_RATE),
        shipping_fee=body.shipping_fee,
        estimated_days_note=body.estimated_days_note,
        valid_until=datetime.now(UTC) + timedelta(days=body.valid_days),
    )
    db.add(quote)
    r.status = RequestStatus.PENDING_PAYMENT
    note = "Tu cotización está lista. Puedes pagarla con PSE, tarjeta o Nequi desde «Estado de tu pedido»."
    db.add(RequestEvent(request_id=r.id, actor_id=user.id, from_status=RequestStatus.QUOTING, to_status=RequestStatus.PENDING_PAYMENT,
                        note=note, visible_to_client=True))
    await audit(db, action="quote.create", target_type="request", target_id=r.code, actor_id=user.id, ip=client_ip(request))
    await db.commit()
    if r.order is not None:
        tasks.add_task(notify, notice_for(r.order, r, note))
    await emit_n8n("quote.created", {"code": r.code, "total": quote.total})
    return {"total": quote.total, "valid_until": quote.valid_until.isoformat()}


# --- Documentos ---------------------------------------------------------------------
@router.post("/requests/{code}/files", status_code=201)
async def upload_file(
    code: str,
    request: Request,
    db: DB,
    kind: Literal["documento_final", "soporte"] = Form("documento_final"),
    file: UploadFile = File(...),
    user: User = Operator,
) -> dict:
    """El operador adjunta el documento expedido (lo descarga el cliente desde «Estado de tu pedido») o un soporte interno."""
    r = await _get(db, code)
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
    f = StoredFile(request_id=r.id, uploaded_by=user.id, kind=kind, original_name=(file.filename or "documento")[:200],
                   storage_key=v.storage_key, mime=v.mime, size=v.size, sha256=v.sha256)
    db.add(f)
    await audit(db, action="file.upload", target_type="request", target_id=r.code, actor_id=user.id, ip=client_ip(request), meta={"kind": kind})
    await db.commit()
    return {"id": str(f.id)}


@router.get("/files/{file_id}/download")
async def download_file(file_id: UUID, request: Request, db: DB, user: User = Operator) -> dict:
    f = await db.scalar(select(StoredFile).where(StoredFile.id == file_id, StoredFile.deleted_at.is_(None)))
    if not f:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Archivo no disponible")
    s = get_settings()
    client = _s3()
    url = await run_in_threadpool(
        client.generate_presigned_url, "get_object",
        Params={"Bucket": s.s3_bucket, "Key": f.storage_key,
                "ResponseContentDisposition": f'attachment; filename="{f.original_name.replace(chr(34), "")}"'},
        ExpiresIn=s.download_url_seconds,
    )
    await audit(db, action="file.download", target_type="file", target_id=str(f.id), actor_id=user.id, ip=client_ip(request))
    await db.commit()
    return {"url": url}


@router.get("/me")
async def whoami(user: User = Operator) -> dict:
    return {"name": user.full_name, "email": user.email, "role": user.role}


@router.get("/audit")
async def audit_log(db: DB, limit: int = 100, user: User = Admin) -> list[dict]:
    rows = await db.scalars(select(AuditLog).order_by(AuditLog.at.desc()).limit(min(limit, 500)))
    return [
        {"at": a.at.isoformat(), "actor": str(a.actor_id) if a.actor_id else None, "action": a.action,
         "target": f"{a.target_type}:{a.target_id}", "meta": a.meta}
        for a in rows
    ]
