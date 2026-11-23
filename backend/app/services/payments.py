"""
Pagos con Wompi (Bancolombia): PSE, tarjetas débito/crédito, Nequi y botón
Bancolombia en un solo checkout.

Flujo:
  1. El servidor calcula el monto (nunca lo acepta del navegador), crea un
     Payment «pending» con una referencia única y firma la integridad.
  2. El cliente paga en el Web Checkout de Wompi y vuelve a /pago/resultado.
  3. Wompi notifica el evento `transaction.updated` al webhook; se verifica la
     firma y se aplica la transacción (idempotente). Como respaldo, la página de
     resultado pide al servidor consultar la transacción directamente a Wompi.

Documentación: https://docs.wompi.co/docs/colombia/widget-checkout-web/
"""
from __future__ import annotations

import hashlib
import secrets
from datetime import UTC, datetime
from typing import Any
from urllib.parse import urlencode

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import Settings, get_settings
from app.domain.request_status import LABELS, RequestStatus, assert_transition
from app.models import Order, Payment, Quote, Request, RequestEvent
from app.services.audit import audit
from app.services.notify import Notice

CHECKOUT_URL = "https://checkout.wompi.co/p/"
CURRENCY = "COP"

# Estados de Wompi → estado interno
STATUS_MAP = {
    "APPROVED": "approved",
    "DECLINED": "declined",
    "VOIDED": "voided",
    "ERROR": "error",
    "PENDING": "pending",
}


def api_base(public_key: str) -> str:
    """Las llaves de prueba (pub_test_) usan el sandbox; las de producción (pub_prod_), producción."""
    return "https://production.wompi.co/v1" if public_key.startswith("pub_prod_") else "https://sandbox.wompi.co/v1"


def new_reference(prefix: str, purpose: str) -> str:
    """Referencia única por intento de pago (Wompi no acepta referencias repetidas)."""
    tag = "V" if purpose == "verification" else "Q"
    return f"{prefix}-{tag}{secrets.token_hex(4).upper()}"


def integrity_signature(reference: str, amount_in_cents: int, currency: str, secret: str) -> str:
    """Firma de integridad del checkout: SHA256(referencia + monto en centavos + moneda + secreto)."""
    return hashlib.sha256(f"{reference}{amount_in_cents}{currency}{secret}".encode()).hexdigest()


def checkout_url(
    *,
    settings: Settings,
    reference: str,
    amount: int,
    redirect_url: str,
    email: str,
    full_name: str,
    phone: str,
    legal_id: str,
    legal_id_type: str,
) -> str:
    cents = amount * 100
    params = {
        "public-key": settings.wompi_public_key,
        "currency": CURRENCY,
        "amount-in-cents": str(cents),
        "reference": reference,
        "signature:integrity": integrity_signature(reference, cents, CURRENCY, settings.wompi_integrity_secret),
        "redirect-url": redirect_url,
        "customer-data:email": email,
        "customer-data:full-name": full_name,
        "customer-data:phone-number": "".join(ch for ch in phone if ch.isdigit())[-10:],
        "customer-data:phone-number-prefix": "+57",
        "customer-data:legal-id": legal_id,
        "customer-data:legal-id-type": legal_id_type if legal_id_type in {"CC", "CE", "NIT", "PP", "TI"} else "CC",
    }
    return f"{CHECKOUT_URL}?{urlencode(params)}"


async def fetch_transaction(transaction_id: str) -> dict[str, Any] | None:
    """Consulta la transacción directamente a Wompi (fuente confiable por TLS)."""
    s = get_settings()
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(f"{api_base(s.wompi_public_key)}/transactions/{transaction_id}")
    if r.status_code != 200:
        return None
    return r.json().get("data")


async def apply_transaction(db: AsyncSession, tx: dict[str, Any], *, source: str) -> Payment | None:
    """
    Aplica una transacción de Wompi ya verificada (por firma o por consulta directa).
    Idempotente: un pago aprobado nunca retrocede y las transiciones sólo ocurren una vez.
    """
    reference = str(tx.get("reference", ""))
    payment = await db.scalar(
        select(Payment)
        .where(Payment.reference == reference)
        .options(
            selectinload(Payment.order).selectinload(Order.requests).selectinload(Request.service),
            selectinload(Payment.order).selectinload(Order.applicant),
            selectinload(Payment.quote).selectinload(Quote.request).selectinload(Request.service),
        )
        .with_for_update()
    )
    if not payment:
        return None
    if payment.status == "approved":
        return payment

    new_status = STATUS_MAP.get(str(tx.get("status", "")).upper(), "pending")
    amount_ok = int(tx.get("amount_in_cents", -1)) == payment.amount * 100 and tx.get("currency", CURRENCY) == CURRENCY
    if not amount_ok:
        payment.status = "error"
        payment.raw_event = {"reason": "amount_mismatch", "tx": tx}
        await audit(db, action="payment.amount_mismatch", target_type="payment", target_id=reference, meta={"source": source})
        await db.commit()
        return payment

    payment.status = new_status
    payment.provider_transaction_id = str(tx.get("id", ""))[:80] or None
    payment.method = str(tx.get("payment_method_type", ""))[:40] or None
    payment.raw_event = {k: tx.get(k) for k in ("id", "status", "reference", "amount_in_cents", "payment_method_type", "created_at", "finalized_at")}

    if new_status == "approved":
        now = datetime.now(UTC)
        if payment.purpose == "verification":
            for r in payment.order.requests:
                _system_transition(db, r, RequestStatus.AWAITING_VERIFICATION, RequestStatus.RECEIVED,
                                   "Pago de verificación aprobado. Empezamos a revisar tu solicitud.")
        elif payment.quote is not None:
            payment.quote.accepted_at = now
            _system_transition(db, payment.quote.request, RequestStatus.PENDING_PAYMENT, RequestStatus.CONFIRMED,
                               "Pago recibido. Iniciamos la gestión ante la entidad.")

    await audit(db, action=f"payment.{new_status}", target_type="payment", target_id=reference,
                meta={"source": source, "purpose": payment.purpose, "method": payment.method})
    await db.commit()
    return payment


def approval_notice(payment: Payment) -> Notice:
    """Aviso al cliente cuando se aprueba un pago (lo envía el endpoint en segundo plano)."""
    order = payment.order
    if payment.purpose == "quote" and payment.quote is not None:
        r = payment.quote.request
        document, label = (r.service.name if r.service else "Otro documento"), LABELS[r.status]
        message = f"Recibimos tu pago de {payment.amount:,} COP. Iniciamos la gestión ante la entidad.".replace(",", ".")
    else:
        document = ", ".join(r.service.name if r.service else "Otro documento" for r in order.requests)
        label = LABELS[RequestStatus.RECEIVED]
        message = f"Recibimos tu pago de verificación de {payment.amount:,} COP. Empezamos a revisar tu pedido.".replace(",", ".")
    return Notice(email=order.applicant.email, phone=order.phone, first_name=order.full_name.split(" ")[0],
                  order_code=order.code, document=document, status_label=label, message=message)


def _system_transition(db: AsyncSession, r: Request, expected: RequestStatus, target: RequestStatus, note: str) -> None:
    if r.status != expected:
        return
    assert_transition(r.status, target, by_system=True)
    r.status = target
    db.add(RequestEvent(request_id=r.id, actor_id=None, from_status=expected, to_status=target, note=note, visible_to_client=True))


def quote_balance(r: Request, quote: Quote, *, credit_verification: bool) -> tuple[int, int, int]:
    """(descuento por verificación, ya pagado, saldo) de una cotización."""
    credited = r.verification_fee if credit_verification and _verification_paid(r) else 0
    paid = sum(p.amount for p in quote.payments if p.status == "approved")
    return credited, paid, max(quote.total - credited - paid, 0)


def _verification_paid(r: Request) -> bool:
    order = r.order
    if order is None or r.verification_fee <= 0:
        return False
    return any(p.purpose == "verification" and p.status == "approved" for p in order.payments)
