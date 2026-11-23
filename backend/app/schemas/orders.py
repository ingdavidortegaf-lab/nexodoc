"""Contratos del pedido (carrito), la consulta de estado y el pago."""
import re
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.domain.request_status import RequestStatus

_CONTROL = re.compile(r"[\x00-\x1f\x7f]")
_FIELD_KEY = re.compile(r"^[a-z][a-z0-9_]{0,39}$")
ORDER_CODE = r"^ND-\d{4}-\d{6}$"
ITEM_CODE = r"^ND-\d{4}-\d{6}-\d{2}$"


def clean(v: str) -> str:
    return _CONTROL.sub(" ", v).strip()


class OrderItemIn(BaseModel):
    """Un documento del carrito. `fields` son los campos del formulario propio del servicio."""

    service: str = Field(min_length=2, max_length=80, pattern=r"^[a-z0-9-]+$")
    fields: dict[str, str] = Field(default_factory=dict)
    files_expected: int = Field(default=0, ge=0, le=5)

    @field_validator("fields")
    @classmethod
    def sanitize_fields(cls, v: dict[str, str]) -> dict[str, str]:
        if len(v) > 40:
            raise ValueError("Demasiados campos.")
        out: dict[str, str] = {}
        for key, value in v.items():
            if not _FIELD_KEY.match(key):
                raise ValueError(f"Campo no válido: {key[:40]}")
            text = clean(str(value))
            if len(text) > 1200:
                raise ValueError(f"El campo {key} supera 1.200 caracteres.")
            if text:
                out[key] = text
        return out


class ShippingIn(BaseModel):
    recipient: str = Field(default="", max_length=120)
    address: str = Field(default="", max_length=200)
    city: str = Field(default="", max_length=80)
    country: str = Field(default="Colombia", max_length=60)
    notes: str = Field(default="", max_length=200)

    @field_validator("*")
    @classmethod
    def strip_controls(cls, v: str) -> str:
        return clean(v)


class OrderCreate(BaseModel):
    """Contrato con frontend/src/lib/validation.ts. Se vuelve a validar aquí."""

    applicantType: Literal["persona", "empresa"]
    fullName: str = Field(min_length=5, max_length=120)
    documentType: Literal["CC", "CE", "PPT", "PA", "NIT", "TI"]
    documentNumber: str = Field(pattern=r"^[A-Za-z0-9.-]{4,20}$")
    email: EmailStr
    phone: str = Field(pattern=r"^\+?[0-9\s-]{7,18}$")
    city: str = Field(min_length=2, max_length=80)
    company: str = Field(default="", max_length=120)
    shipping: ShippingIn | None = None
    items: list[OrderItemIn] = Field(min_length=1, max_length=10)
    dataConsent: Literal[True]
    termsConsent: Literal[True]
    marketingConsent: bool = False
    policyVersion: str = Field(max_length=20)
    source: str = Field(default="web", max_length=20)

    @field_validator("fullName", "city", "company")
    @classmethod
    def strip_controls(cls, v: str) -> str:
        return clean(v)


class OrderItemCreated(BaseModel):
    code: str
    service: str


class PaymentInfo(BaseModel):
    required: bool  # hay que pagar la verificación antes de que el pedido entre a revisión
    amount: int
    enabled: bool  # la pasarela está configurada


class OrderCreated(BaseModel):
    code: str
    upload_token: str
    items: list[OrderItemCreated]
    payment: PaymentInfo


class TrackIn(BaseModel):
    code: str = Field(pattern=ORDER_CODE)
    email: EmailStr


class EventOut(BaseModel):
    to_status: RequestStatus
    label: str
    note: str | None
    created_at: datetime


class QuoteOut(BaseModel):
    entity_fees: int
    service_fee: int
    vat_on_service: int
    shipping_fee: int
    total: int
    credited: int  # valor de verificación descontado
    paid: int
    amount_due: int
    estimated_days_note: str
    valid_until: datetime
    payable: bool


class TrackItemOut(BaseModel):
    code: str
    service: str
    service_slug: str | None
    status: RequestStatus
    status_label: str
    summary: list[tuple[str, str]]
    events: list[EventOut]
    quote: QuoteOut | None
    documents: list["DocumentOut"] = []


class DocumentOut(BaseModel):
    """Documento expedido que el cliente puede descargar."""

    id: str
    name: str
    size: int
    created_at: datetime


class DownloadOut(BaseModel):
    url: str


class TrackPaymentOut(BaseModel):
    reference: str
    purpose: str
    amount: int
    status: str
    method: str | None
    created_at: datetime


class TrackOut(BaseModel):
    code: str
    created_at: datetime
    applicant_name: str
    verification_total: int
    verification_paid: bool
    verification_payable: bool
    payments_enabled: bool
    items: list[TrackItemOut]
    payments: list[TrackPaymentOut]


class CheckoutIn(BaseModel):
    code: str = Field(pattern=ORDER_CODE)
    email: EmailStr
    purpose: Literal["verification", "quote"]
    item: str | None = Field(default=None, pattern=ITEM_CODE)


class CheckoutOut(BaseModel):
    url: str
    reference: str
    amount: int


class TransactionStatusOut(BaseModel):
    order_code: str | None
    status: str
    purpose: str | None
    amount: int | None
    method: str | None


TrackItemOut.model_rebuild()
