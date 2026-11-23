"""
Modelo de datos de NEXODOC (PostgreSQL). Ver docs/ARCHITECTURE.md §7.
Montos en pesos colombianos como enteros (sin decimales flotantes).

Un PEDIDO (Order) agrupa uno o varios documentos del carrito. Cada documento es
una SOLICITUD (Request) con su propio estado, cotización y archivos.
"""
from __future__ import annotations

from datetime import datetime
from enum import StrEnum
from typing import Any
from uuid import UUID

from sqlalchemy import BigInteger, Boolean, DateTime, Enum, ForeignKey, Index, Integer, Sequence, String, Text, func
from sqlalchemy.dialects.postgresql import INET, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.domain.request_status import RequestStatus
from app.models.base import Base, TimestampMixin


class Role(StrEnum):
    CLIENT = "client"
    OPERATOR = "operator"
    SUPERVISOR = "supervisor"
    ADMIN = "admin"


ROLE_RANK = {Role.CLIENT: 0, Role.OPERATOR: 1, Role.SUPERVISOR: 2, Role.ADMIN: 3}


def _values(enum_cls: type[StrEnum]) -> list[str]:
    """Guardar en BD el valor ("received"), no el nombre ("RECEIVED"): coincide con el frontend."""
    return [m.value for m in enum_cls]


STATUS_ENUM = Enum(RequestStatus, name="request_status", values_callable=_values)

# Numeración pública de pedidos sin condiciones de carrera (ND-AAAA-NNNNNN)
ORDER_CODE_SEQ = Sequence("order_code_seq", start=1, metadata=Base.metadata)


class User(TimestampMixin, Base):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(254), unique=True, index=True)
    password_hash: Mapped[str | None] = mapped_column(String(255))  # None = sin acceso al portal
    full_name: Mapped[str] = mapped_column(String(120))
    phone: Mapped[str] = mapped_column(String(20))
    city: Mapped[str] = mapped_column(String(80))
    applicant_type: Mapped[str] = mapped_column(String(10), default="persona")
    company: Mapped[str | None] = mapped_column(String(120))
    document_type: Mapped[str] = mapped_column(String(4))
    document_number_enc: Mapped[str] = mapped_column(Text)  # cifrado (Fernet)
    document_number_idx: Mapped[str] = mapped_column(String(40), index=True)  # índice ciego
    role: Mapped[Role] = mapped_column(Enum(Role, name="user_role", values_callable=_values), default=Role.CLIENT)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    requests: Mapped[list[Request]] = relationship(back_populates="applicant", foreign_keys="Request.applicant_id")


class ServiceCategory(TimestampMixin, Base):
    __tablename__ = "service_categories"

    slug: Mapped[str] = mapped_column(String(80), unique=True)
    name: Mapped[str] = mapped_column(String(120))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    services: Mapped[list[Service]] = relationship(back_populates="category")


class Service(TimestampMixin, Base):
    __tablename__ = "services"

    category_id: Mapped[UUID] = mapped_column(ForeignKey("service_categories.id"))
    slug: Mapped[str] = mapped_column(String(80), unique=True)
    name: Mapped[str] = mapped_column(String(160))
    entity: Mapped[str] = mapped_column(String(200))
    modality: Mapped[str] = mapped_column(String(12))
    base_service_fee: Mapped[int | None] = mapped_column(Integer)  # honorario de referencia, COP
    # Valor que se paga al enviar para verificar disponibilidad (0 = sin cobro previo).
    # Lo calcula SIEMPRE el servidor: nunca se acepta un monto enviado por el navegador.
    verification_fee: Mapped[int] = mapped_column(Integer, default=0)
    price_from: Mapped[int | None] = mapped_column(Integer)  # "desde", sólo informativo
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    category: Mapped[ServiceCategory] = relationship(back_populates="services")


class Order(TimestampMixin, Base):
    """Pedido: lo que el cliente envía desde el carrito (uno o varios documentos)."""

    __tablename__ = "orders"

    code: Mapped[str] = mapped_column(String(20), unique=True)  # ND-2026-000123
    applicant_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"), index=True)
    # Datos del solicitante tal como los diligenció en ESTE pedido (no se sobrescribe la ficha del usuario)
    full_name: Mapped[str] = mapped_column(String(120))
    phone: Mapped[str] = mapped_column(String(20))
    city: Mapped[str] = mapped_column(String(80))
    applicant_type: Mapped[str] = mapped_column(String(10), default="persona")
    company: Mapped[str | None] = mapped_column(String(120))
    document_type: Mapped[str] = mapped_column(String(4))
    document_number_enc: Mapped[str] = mapped_column(Text)
    shipping: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict)  # dirección para entregas físicas
    verification_total: Mapped[int] = mapped_column(BigInteger, default=0)
    source: Mapped[str] = mapped_column(String(20), default="web")

    applicant: Mapped[User] = relationship()
    requests: Mapped[list[Request]] = relationship(back_populates="order", order_by="Request.code")
    payments: Mapped[list[Payment]] = relationship(back_populates="order", order_by="Payment.created_at")


class Request(TimestampMixin, Base):
    __tablename__ = "requests"
    __table_args__ = (Index("ix_requests_status_created", "status", "created_at"),)

    code: Mapped[str] = mapped_column(String(20), unique=True)  # ND-2026-000123-01
    order_id: Mapped[UUID | None] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), index=True)
    applicant_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"))
    operator_id: Mapped[UUID | None] = mapped_column(ForeignKey("users.id"))
    service_id: Mapped[UUID | None] = mapped_column(ForeignKey("services.id"))  # None = "otro"
    status: Mapped[RequestStatus] = mapped_column(STATUS_ENUM, default=RequestStatus.RECEIVED)
    details: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict)  # campos del formulario del servicio
    verification_fee: Mapped[int] = mapped_column(BigInteger, default=0)
    source: Mapped[str] = mapped_column(String(20), default="web")
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    purge_after: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))  # retención de documentos

    order: Mapped[Order | None] = relationship(back_populates="requests")
    applicant: Mapped[User] = relationship(back_populates="requests", foreign_keys=[applicant_id])
    service: Mapped[Service | None] = relationship()
    events: Mapped[list[RequestEvent]] = relationship(order_by="RequestEvent.created_at", cascade="all, delete-orphan")
    quotes: Mapped[list[Quote]] = relationship(back_populates="request", order_by="Quote.created_at", cascade="all, delete-orphan")
    files: Mapped[list[StoredFile]] = relationship(cascade="all, delete-orphan")


class RequestEvent(TimestampMixin, Base):
    """Historial inmutable de transiciones."""

    __tablename__ = "request_events"

    request_id: Mapped[UUID] = mapped_column(ForeignKey("requests.id", ondelete="CASCADE"), index=True)
    actor_id: Mapped[UUID | None] = mapped_column(ForeignKey("users.id"))  # None = sistema
    from_status: Mapped[RequestStatus | None] = mapped_column(STATUS_ENUM)
    to_status: Mapped[RequestStatus] = mapped_column(STATUS_ENUM)
    note: Mapped[str | None] = mapped_column(Text)
    visible_to_client: Mapped[bool] = mapped_column(Boolean, default=True)


class Quote(TimestampMixin, Base):
    __tablename__ = "quotes"

    request_id: Mapped[UUID] = mapped_column(ForeignKey("requests.id", ondelete="CASCADE"), index=True)
    entity_fees: Mapped[int] = mapped_column(BigInteger)  # derechos de la entidad (sin IVA)
    service_fee: Mapped[int] = mapped_column(BigInteger)  # honorario NEXODOC
    vat_on_service: Mapped[int] = mapped_column(BigInteger)  # IVA sólo sobre el honorario
    shipping_fee: Mapped[int] = mapped_column(BigInteger, default=0)
    estimated_days_note: Mapped[str] = mapped_column(String(200))  # "Según la ORIP: 3 a 5 días hábiles"
    valid_until: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    accepted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    request: Mapped[Request] = relationship(back_populates="quotes")
    payments: Mapped[list[Payment]] = relationship(back_populates="quote")

    @property
    def total(self) -> int:
        return self.entity_fees + self.service_fee + self.vat_on_service + self.shipping_fee


class Payment(TimestampMixin, Base):
    """Un intento de pago en la pasarela. Sólo un evento verificado lo marca como aprobado."""

    __tablename__ = "payments"

    order_id: Mapped[UUID] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), index=True)
    quote_id: Mapped[UUID | None] = mapped_column(ForeignKey("quotes.id", ondelete="CASCADE"), index=True)
    purpose: Mapped[str] = mapped_column(String(20))  # verification | quote
    provider: Mapped[str] = mapped_column(String(20), default="wompi")
    reference: Mapped[str] = mapped_column(String(64), unique=True)  # referencia enviada a la pasarela
    provider_transaction_id: Mapped[str | None] = mapped_column(String(80))
    amount: Mapped[int] = mapped_column(BigInteger)  # COP
    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending | approved | declined | voided | error
    method: Mapped[str | None] = mapped_column(String(40))  # PSE, CARD, NEQUI, BANCOLOMBIA_TRANSFER…
    raw_event: Mapped[dict[str, Any] | None] = mapped_column(JSONB)

    order: Mapped[Order] = relationship(back_populates="payments")
    quote: Mapped[Quote | None] = relationship(back_populates="payments")


class StoredFile(TimestampMixin, Base):
    """Sólo metadatos: el binario vive en un bucket privado."""

    __tablename__ = "stored_files"

    request_id: Mapped[UUID] = mapped_column(ForeignKey("requests.id", ondelete="CASCADE"), index=True)
    uploaded_by: Mapped[UUID | None] = mapped_column(ForeignKey("users.id"))
    kind: Mapped[str] = mapped_column(String(20))  # soporte | documento_final
    original_name: Mapped[str] = mapped_column(String(200))
    storage_key: Mapped[str] = mapped_column(String(300), unique=True)
    mime: Mapped[str] = mapped_column(String(60))
    size: Mapped[int] = mapped_column(Integer)
    sha256: Mapped[str] = mapped_column(String(64))
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class Consent(TimestampMixin, Base):
    """Prueba de la autorización del titular (art. 9 Ley 1581 de 2012)."""

    __tablename__ = "consents"

    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"), index=True)
    order_id: Mapped[UUID | None] = mapped_column(ForeignKey("orders.id", ondelete="SET NULL"))
    purpose: Mapped[str] = mapped_column(String(40))  # tratamiento_datos | terminos | marketing
    granted: Mapped[bool] = mapped_column(Boolean)
    policy_version: Mapped[str] = mapped_column(String(20))
    ip: Mapped[str | None] = mapped_column(INET)
    user_agent: Mapped[str | None] = mapped_column(String(300))


class AuditLog(Base):
    """Bitácora de sólo inserción. Revocar UPDATE/DELETE al rol de la app en BD."""

    __tablename__ = "audit_log"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)
    actor_id: Mapped[UUID | None] = mapped_column(ForeignKey("users.id"))
    action: Mapped[str] = mapped_column(String(60))  # request.create, status.change, file.download…
    target_type: Mapped[str] = mapped_column(String(40))
    target_id: Mapped[str] = mapped_column(String(60))
    ip: Mapped[str | None] = mapped_column(INET)
    meta: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict)
