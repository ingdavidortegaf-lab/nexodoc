"""Webhook de Wompi y conciliación de transacciones."""
import re
from typing import Any

from fastapi import APIRouter, BackgroundTasks, HTTPException, Request, status
from sqlalchemy import select

from app.api.deps import DB
from app.core.config import get_settings
from app.models import Payment
from app.schemas.orders import TransactionStatusOut
from app.services.audit import audit
from app.services.integrations import verify_wompi_event
from app.services.notify import notify
from app.services.payments import apply_transaction, approval_notice, fetch_transaction

router = APIRouter(prefix="/payments", tags=["payments"])
_TX_ID = re.compile(r"^[A-Za-z0-9-]{5,64}$")


async def _apply_and_notify(db: DB, tx: dict[str, Any], source: str, tasks: BackgroundTasks) -> Payment | None:
    """Aplica la transacción y, si el pago quedó aprobado en esta llamada, avisa al cliente."""
    before = await db.scalar(select(Payment.status).where(Payment.reference == str(tx.get("reference", ""))))
    payment = await apply_transaction(db, tx, source=source)
    if payment is not None and before != "approved" and payment.status == "approved":
        tasks.add_task(notify, approval_notice(payment))
    return payment


@router.post("/wompi/events", status_code=200)
async def wompi_events(request: Request, db: DB, tasks: BackgroundTasks) -> dict:
    """
    Eventos `transaction.updated` de Wompi. Sólo se aplican si la firma es válida.
    Configura esta URL en el panel de Wompi: https://api.tudominio.co/v1/payments/wompi/events
    """
    try:
        event = await request.json()
    except ValueError:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "JSON inválido") from None
    checksum = str((event.get("signature") or {}).get("checksum") or request.headers.get("x-event-checksum", ""))
    if not verify_wompi_event(event, checksum):
        await audit(db, action="payment.webhook_rejected", target_type="webhook", target_id="wompi")
        await db.commit()
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Firma inválida")
    if event.get("event") != "transaction.updated":
        return {"ok": True, "ignored": True}
    tx = (event.get("data") or {}).get("transaction") or {}
    await _apply_and_notify(db, tx, "webhook", tasks)
    return {"ok": True}


@router.get("/wompi/transactions/{transaction_id}", response_model=TransactionStatusOut)
async def reconcile(transaction_id: str, db: DB, tasks: BackgroundTasks) -> TransactionStatusOut:
    """
    La página /pago/resultado llama aquí con el `id` que Wompi agrega a la URL de regreso.
    Se consulta la transacción directamente a Wompi (no se confía en la URL) y se aplica.
    """
    if not get_settings().wompi_ready:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Pagos no habilitados")
    if not _TX_ID.match(transaction_id):
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Transacción no válida")
    tx = await fetch_transaction(transaction_id)
    if not tx:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Transacción no encontrada")
    payment = await _apply_and_notify(db, tx, "reconcile", tasks)
    if not payment:
        return TransactionStatusOut(order_code=None, status=str(tx.get("status", "")).lower(), purpose=None, amount=None, method=None)
    return TransactionStatusOut(
        order_code=payment.order.code,
        status=payment.status,
        purpose=payment.purpose,
        amount=payment.amount,
        method=payment.method,
    )
