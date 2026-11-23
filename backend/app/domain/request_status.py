"""
Máquina de estados de una solicitud (un documento dentro de un pedido).
Sin dependencias externas para poder probarla de forma aislada. Los códigos
coinciden con frontend/src/lib/data/statuses.ts.

Flujo de pago en dos partes:
  1. Al enviar el pedido se paga el valor de verificación (si el servicio lo tiene
     y la pasarela está activa): «Pendiente de pago de verificación» → «Recibida».
  2. Tras confirmar disponibilidad con la entidad se emite la cotización final:
     «Pendiente de pago» → «Confirmada».
Ambas confirmaciones sólo las hace el sistema con un pago verificado.
"""
from __future__ import annotations

from enum import StrEnum


class RequestStatus(StrEnum):
    AWAITING_VERIFICATION = "awaiting_verification"
    RECEIVED = "received"
    IN_REVIEW = "in_review"
    NEEDS_INFO = "needs_info"
    QUOTING = "quoting"
    PENDING_PAYMENT = "pending_payment"
    CONFIRMED = "confirmed"
    IN_PROGRESS = "in_progress"
    AWAITING_ENTITY = "awaiting_entity"
    DOCUMENT_AVAILABLE = "document_available"
    DELIVERED = "delivered"
    CLOSED = "closed"
    REJECTED_CANCELLED = "rejected_cancelled"


LABELS: dict[RequestStatus, str] = {
    RequestStatus.AWAITING_VERIFICATION: "Pendiente de pago de verificación",
    RequestStatus.RECEIVED: "Recibida",
    RequestStatus.IN_REVIEW: "En revisión",
    RequestStatus.NEEDS_INFO: "Requiere información",
    RequestStatus.QUOTING: "En cotización",
    RequestStatus.PENDING_PAYMENT: "Pendiente de pago",
    RequestStatus.CONFIRMED: "Confirmada",
    RequestStatus.IN_PROGRESS: "En gestión",
    RequestStatus.AWAITING_ENTITY: "En espera de respuesta de la entidad",
    RequestStatus.DOCUMENT_AVAILABLE: "Documento disponible",
    RequestStatus.DELIVERED: "Entregada",
    RequestStatus.CLOSED: "Cerrada",
    RequestStatus.REJECTED_CANCELLED: "Rechazada o cancelada",
}

S = RequestStatus
_CANCELLABLE = {
    S.AWAITING_VERIFICATION, S.RECEIVED, S.IN_REVIEW, S.NEEDS_INFO, S.QUOTING,
    S.PENDING_PAYMENT, S.IN_PROGRESS, S.AWAITING_ENTITY,
}

_BASE: dict[RequestStatus, frozenset[RequestStatus]] = {
    S.AWAITING_VERIFICATION: frozenset({S.RECEIVED}),
    S.RECEIVED: frozenset({S.IN_REVIEW}),
    S.IN_REVIEW: frozenset({S.NEEDS_INFO, S.QUOTING}),
    S.NEEDS_INFO: frozenset({S.IN_REVIEW}),
    S.QUOTING: frozenset({S.PENDING_PAYMENT}),
    S.PENDING_PAYMENT: frozenset({S.CONFIRMED, S.QUOTING}),  # re-cotizar si cambia el alcance
    S.CONFIRMED: frozenset({S.IN_PROGRESS}),
    S.IN_PROGRESS: frozenset({S.AWAITING_ENTITY, S.DOCUMENT_AVAILABLE}),
    S.AWAITING_ENTITY: frozenset({S.IN_PROGRESS, S.DOCUMENT_AVAILABLE}),
    S.DOCUMENT_AVAILABLE: frozenset({S.DELIVERED}),
    S.DELIVERED: frozenset({S.CLOSED}),
    S.CLOSED: frozenset(),
    S.REJECTED_CANCELLED: frozenset(),
}
TRANSITIONS: dict[RequestStatus, frozenset[RequestStatus]] = {
    k: v | ({S.REJECTED_CANCELLED} if k in _CANCELLABLE else frozenset()) for k, v in _BASE.items()
}

# Transiciones que sólo el sistema puede hacer (pago verificado por la pasarela)
SYSTEM_ONLY: frozenset[tuple[RequestStatus, RequestStatus]] = frozenset(
    {(S.AWAITING_VERIFICATION, S.RECEIVED), (S.PENDING_PAYMENT, S.CONFIRMED)}
)

TERMINAL = frozenset({S.CLOSED, S.REJECTED_CANCELLED})


class InvalidTransition(ValueError):
    def __init__(self, current: RequestStatus, target: RequestStatus):
        super().__init__(f"No se puede pasar de «{LABELS[current]}» a «{LABELS[target]}».")
        self.current, self.target = current, target


def can_transition(current: RequestStatus, target: RequestStatus) -> bool:
    return target in TRANSITIONS[current]


def assert_transition(current: RequestStatus, target: RequestStatus, *, by_system: bool = False) -> None:
    if not can_transition(current, target):
        raise InvalidTransition(current, target)
    if (current, target) in SYSTEM_ONLY and not by_system:
        raise InvalidTransition(current, target)


def requires_note(target: RequestStatus) -> bool:
    """Pedir información o rechazar exige explicar el motivo al cliente."""
    return target in {S.NEEDS_INFO, S.REJECTED_CANCELLED}
