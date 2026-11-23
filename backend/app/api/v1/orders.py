"""
Pedidos públicos (carrito), carga de soportes, consulta de estado por código +
correo y creación del pago. No requieren cuenta: el código del pedido y el
correo del solicitante actúan como llave, con límite de intentos.
"""
from datetime import UTC, datetime
from typing import Annotated

import boto3
import jwt
from fastapi import APIRouter, BackgroundTasks, File, Header, HTTPException, Request, UploadFile, status
from fastapi.concurrency import run_in_threadpool
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api.deps import DB, client_ip
from app.core.config import get_settings
from app.core.security import blind_index, create_upload_token, decode_upload_token, decrypt_field, encrypt_field
from app.domain.request_status import LABELS, TERMINAL, RequestStatus
from app.models import Consent, Order, Payment, Quote, Request as Req, RequestEvent, Service, StoredFile, User
from app.schemas.orders import (
    CheckoutIn,
    CheckoutOut,
    DocumentOut,
    DownloadOut,
    EventOut,
    OrderCreate,
    OrderCreated,
    OrderItemCreated,
    PaymentInfo,
    QuoteOut,
    TrackIn,
    TrackItemOut,
    TrackOut,
    TrackPaymentOut,
)
from app.services import ratelimit
from app.services.audit import audit
from app.services.codes import item_code, next_order_code
from app.services.files import FileRejected, validate_upload
from app.services.integrations import emit_n8n
from app.services.notify import Notice, notify
from app.services.payments import checkout_url, new_reference, quote_balance

router = APIRouter(tags=["orders"])

NOT_FOUND = "No encontramos un pedido con ese número y correo."


def _s3():
    s = get_settings()
    if not (s.s3_endpoint_url and s.s3_access_key_id):
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Almacenamiento no configurado")
    return boto3.client(
        "s3",
        endpoint_url=s.s3_endpoint_url,
        aws_access_key_id=s.s3_access_key_id,
        aws_secret_access_key=s.s3_secret_access_key,
    )


def _order_query():
    return select(Order).options(
        selectinload(Order.applicant),
        selectinload(Order.payments),
        selectinload(Order.requests).selectinload(Req.events),
        selectinload(Order.requests).selectinload(Req.service),
        selectinload(Order.requests).selectinload(Req.order).selectinload(Order.payments),
        selectinload(Order.requests).selectinload(Req.quotes).selectinload(Quote.payments),
        selectinload(Order.requests).selectinload(Req.files),
    )


# --- Crear pedido -------------------------------------------------------------
@router.post("/orders", response_model=OrderCreated, status_code=201)
async def create_order(body: OrderCreate, request: Request, db: DB, tasks: BackgroundTasks) -> OrderCreated:
    s = get_settings()
    ip = client_ip(request)
    if not ratelimit.orders_by_ip.allow(f"order:{ip}"):
        raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS, "Demasiados pedidos seguidos. Inténtalo más tarde.")

    # Servicios: el precio de verificación sale de la base de datos, nunca del navegador.
    slugs = {i.service for i in body.items if i.service != "otro"}
    services = {sv.slug: sv for sv in await db.scalars(select(Service).where(Service.slug.in_(slugs), Service.is_active.is_(True)))}
    missing = slugs - services.keys()
    if missing:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, f"Servicio no disponible: {sorted(missing)[0]}")
    for item in body.items:
        if item.service == "otro" and len(item.fields.get("descripcion", "")) < 15:
            raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Describe el documento que necesitas.")

    email = body.email.lower()
    user = await db.scalar(select(User).where(User.email == email))
    if not user:
        # La ficha del usuario sólo se crea; un pedido posterior con el mismo correo no la sobrescribe.
        user = User(
            email=email,
            full_name=body.fullName,
            phone=body.phone,
            city=body.city,
            applicant_type=body.applicantType,
            company=body.company or None,
            document_type=body.documentType,
            document_number_enc=encrypt_field(body.documentNumber),
            document_number_idx=blind_index(body.documentNumber),
        )
        db.add(user)
        await db.flush()

    fees = [services[i.service].verification_fee if i.service in services else 0 for i in body.items]
    verification_total = sum(fees)
    needs_payment = verification_total > 0 and s.wompi_ready
    initial = RequestStatus.AWAITING_VERIFICATION if needs_payment else RequestStatus.RECEIVED

    order = Order(
        code=await next_order_code(db),
        applicant_id=user.id,
        full_name=body.fullName,
        phone=body.phone,
        city=body.city,
        applicant_type=body.applicantType,
        company=body.company or None,
        document_type=body.documentType,
        document_number_enc=encrypt_field(body.documentNumber),
        shipping=body.shipping.model_dump() if body.shipping else {},
        verification_total=verification_total if needs_payment else 0,
        source=body.source,
    )
    db.add(order)
    await db.flush()

    ua = (request.headers.get("user-agent") or "")[:300]
    for purpose, granted in (("tratamiento_datos", True), ("terminos", True), ("marketing", body.marketingConsent)):
        db.add(Consent(user_id=user.id, order_id=order.id, purpose=purpose, granted=granted,
                       policy_version=body.policyVersion, ip=ip, user_agent=ua))

    created: list[OrderItemCreated] = []
    for n, (item, fee) in enumerate(zip(body.items, fees), start=1):
        sv = services.get(item.service)
        r = Req(
            code=item_code(order.code, n),
            order_id=order.id,
            applicant_id=user.id,
            service_id=sv.id if sv else None,
            status=initial,
            details={"service": item.service, "fields": item.fields, "files_expected": item.files_expected},
            verification_fee=fee if needs_payment else 0,
            source=body.source,
        )
        db.add(r)
        await db.flush()
        db.add(RequestEvent(request_id=r.id, from_status=None, to_status=initial))
        created.append(OrderItemCreated(code=r.code, service=item.service))

    await audit(db, action="order.create", target_type="order", target_id=order.code, ip=ip,
                meta={"items": len(created), "verification_total": order.verification_total})
    await db.commit()
    names = [services[i.service].name if i.service in services else "Otro documento" for i in body.items]
    tasks.add_task(notify, Notice(
        email=email, phone=body.phone, first_name=body.fullName.split(" ")[0], order_code=order.code,
        document=", ".join(names), status_label=LABELS[initial],
        message=("Recibimos tu pedido. Para empezar, completa el pago de verificación desde «Estado de tu pedido»."
                 if needs_payment else "Recibimos tu pedido. Un gestor lo revisará y te enviará la cotización."),
    ))
    await emit_n8n("order.created", {"code": order.code, "items": [c.service for c in created]})
    return OrderCreated(
        code=order.code,
        upload_token=create_upload_token(order.code),
        items=created,
        payment=PaymentInfo(required=needs_payment, amount=order.verification_total, enabled=s.wompi_ready),
    )


# --- Soportes del pedido ------------------------------------------------------
@router.post("/orders/{code}/items/{item}/files", status_code=201)
async def upload_order_file(
    code: str,
    item: str,
    request: Request,
    db: DB,
    authorization: Annotated[str | None, Header()] = None,
    file: UploadFile = File(...),
) -> dict:
    token = (authorization or "").removeprefix("Bearer ").strip()
    try:
        if decode_upload_token(token) != code:
            raise jwt.InvalidTokenError
    except jwt.PyJWTError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "El enlace para adjuntar archivos venció.") from None

    r = await db.scalar(
        select(Req).join(Order).options(selectinload(Req.files)).where(Order.code == code, Req.code == item)
    )
    if not r:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Documento no encontrado en el pedido")
    if r.status in TERMINAL:
        raise HTTPException(status.HTTP_409_CONFLICT, "La solicitud está cerrada")
    s = get_settings()
    if len([f for f in r.files if f.deleted_at is None]) >= s.max_files_per_item:
        raise HTTPException(status.HTTP_409_CONFLICT, f"Máximo {s.max_files_per_item} archivos por documento")

    content = await file.read(s.max_upload_mb * 1024 * 1024 + 1)
    try:
        v = validate_upload(content, request_code=r.code, max_mb=s.max_upload_mb)
    except FileRejected as e:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, str(e)) from None

    client = _s3()
    await run_in_threadpool(
        client.put_object, Bucket=s.s3_bucket, Key=v.storage_key, Body=content, ContentType=v.mime, ServerSideEncryption="AES256"
    )
    try:
        db.add(StoredFile(request_id=r.id, uploaded_by=None, kind="soporte", original_name=(file.filename or "archivo")[:200],
                          storage_key=v.storage_key, mime=v.mime, size=v.size, sha256=v.sha256))
        await audit(db, action="file.upload", target_type="request", target_id=r.code, ip=client_ip(request))
        await db.commit()
    except Exception:
        # No dejar binarios huérfanos si falla la base de datos
        await run_in_threadpool(client.delete_object, Bucket=s.s3_bucket, Key=v.storage_key)
        raise
    return {"ok": True}


# --- Consulta de estado ---------------------------------------------------------
async def _authorized_order(db: DB, request: Request, code: str, email: str) -> Order:
    ip = client_ip(request)
    if not (ratelimit.track_by_ip.allow(f"ip:{ip}") and ratelimit.track_by_code.allow(f"code:{code}")):
        raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS, "Demasiados intentos. Espera unos minutos.")
    order = await db.scalar(_order_query().where(Order.code == code))
    if not order or order.applicant.email != email.lower():
        # Misma respuesta si el pedido no existe o el correo no coincide
        raise HTTPException(status.HTTP_404_NOT_FOUND, NOT_FOUND)
    return order


def _summary(r: Req) -> list[tuple[str, str]]:
    fields = (r.details or {}).get("fields", {})
    return [(k, v) for k, v in list(fields.items())[:12]]


def _track_out(order: Order) -> TrackOut:
    s = get_settings()
    now = datetime.now(UTC)
    verification_paid = any(p.purpose == "verification" and p.status == "approved" for p in order.payments)
    items: list[TrackItemOut] = []
    for r in order.requests:
        quote_out = None
        if r.quotes:
            q = r.quotes[-1]
            credited, paid, due = quote_balance(r, q, credit_verification=s.credit_verification_fee)
            quote_out = QuoteOut(
                entity_fees=q.entity_fees, service_fee=q.service_fee, vat_on_service=q.vat_on_service,
                shipping_fee=q.shipping_fee, total=q.total, credited=credited, paid=paid, amount_due=due,
                estimated_days_note=q.estimated_days_note, valid_until=q.valid_until,
                payable=r.status == RequestStatus.PENDING_PAYMENT and q.valid_until > now and due > 0 and s.wompi_ready,
            )
        items.append(TrackItemOut(
            code=r.code,
            service=r.service.name if r.service else "Otro documento",
            service_slug=(r.details or {}).get("service"),
            status=r.status,
            status_label=LABELS[r.status],
            summary=_summary(r),
            events=[EventOut(to_status=e.to_status, label=LABELS[e.to_status], note=e.note, created_at=e.created_at)
                    for e in r.events if e.visible_to_client],
            quote=quote_out,
            documents=[DocumentOut(id=str(f.id), name=f.original_name, size=f.size, created_at=f.created_at)
                       for f in r.files if f.kind == "documento_final" and f.deleted_at is None],
        ))
    return TrackOut(
        code=order.code,
        created_at=order.created_at,
        applicant_name=order.full_name.split(" ")[0],
        verification_total=order.verification_total,
        verification_paid=verification_paid,
        verification_payable=(order.verification_total > 0 and not verification_paid and s.wompi_ready
                              and any(r.status == RequestStatus.AWAITING_VERIFICATION for r in order.requests)),
        payments_enabled=s.wompi_ready,
        items=items,
        payments=[TrackPaymentOut(reference=p.reference, purpose=p.purpose, amount=p.amount, status=p.status,
                                  method=p.method, created_at=p.created_at) for p in order.payments],
    )


@router.post("/track", response_model=TrackOut)
async def track(body: TrackIn, request: Request, db: DB) -> TrackOut:
    return _track_out(await _authorized_order(db, request, body.code, body.email))


@router.post("/track/documents/{file_id}", response_model=DownloadOut)
async def download_document(file_id: str, body: TrackIn, request: Request, db: DB) -> DownloadOut:
    """Enlace firmado de corta duración al documento expedido. Sólo documentos finales del propio pedido."""
    order = await _authorized_order(db, request, body.code, body.email)
    f = next((f for r in order.requests for f in r.files
              if str(f.id) == file_id and f.kind == "documento_final" and f.deleted_at is None), None)
    if not f:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Documento no disponible")
    s = get_settings()
    client = _s3()
    url = await run_in_threadpool(
        client.generate_presigned_url, "get_object",
        Params={"Bucket": s.s3_bucket, "Key": f.storage_key,
                "ResponseContentDisposition": f'attachment; filename="{f.original_name.replace(chr(34), "")}"'},
        ExpiresIn=s.download_url_seconds,
    )
    await audit(db, action="file.download", target_type="file", target_id=str(f.id), ip=client_ip(request), meta={"by": "client"})
    await db.commit()
    return DownloadOut(url=url)


# --- Pago ---------------------------------------------------------------------
@router.post("/payments/checkout", response_model=CheckoutOut)
async def create_checkout(body: CheckoutIn, request: Request, db: DB) -> CheckoutOut:
    s = get_settings()
    if not s.wompi_ready:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Los pagos en línea no están habilitados.")
    order = await _authorized_order(db, request, body.code, body.email)
    out = _track_out(order)

    quote: Quote | None = None
    if body.purpose == "verification":
        if not out.verification_payable:
            raise HTTPException(status.HTTP_409_CONFLICT, "Este pedido no tiene un pago de verificación pendiente.")
        amount, prefix = order.verification_total, order.code
    else:
        r = next((x for x in order.requests if x.code == body.item), None)
        item_out = next((x for x in out.items if x.code == body.item), None)
        if not r or not item_out or not item_out.quote or not item_out.quote.payable:
            raise HTTPException(status.HTTP_409_CONFLICT, "Esta cotización no está disponible para pago.")
        quote, amount, prefix = r.quotes[-1], item_out.quote.amount_due, r.code

    reference = new_reference(prefix, body.purpose)
    db.add(Payment(order_id=order.id, quote_id=quote.id if quote else None, purpose=body.purpose,
                   reference=reference, amount=amount, status="pending"))
    await audit(db, action="payment.checkout", target_type="order", target_id=order.code, ip=client_ip(request),
                meta={"purpose": body.purpose, "amount": amount, "reference": reference})
    await db.commit()

    url = checkout_url(
        settings=s,
        reference=reference,
        amount=amount,
        redirect_url=f"{s.public_site_url.rstrip('/')}/pago/resultado",
        email=order.applicant.email,
        full_name=order.full_name,
        phone=order.phone,
        legal_id=decrypt_field(order.document_number_enc),
        legal_id_type=order.document_type,
    )
    return CheckoutOut(url=url, reference=reference, amount=amount)
