"""Contratos del portal autenticado y del panel administrativo."""
from datetime import datetime

from pydantic import BaseModel, Field

from app.domain.request_status import LABELS, RequestStatus


class StatusChange(BaseModel):
    to: RequestStatus
    note: str | None = Field(default=None, max_length=1000)
    visible_to_client: bool = True


class EventOut(BaseModel):
    to_status: RequestStatus
    label: str
    note: str | None
    created_at: datetime


class RequestOut(BaseModel):
    code: str
    status: RequestStatus
    status_label: str
    service: str | None
    created_at: datetime
    events: list[EventOut] = []

    @classmethod
    def from_model(cls, r, *, client_view: bool = True) -> "RequestOut":
        return cls(
            code=r.code,
            status=r.status,
            status_label=LABELS[r.status],
            service=r.service.name if r.service else None,
            created_at=r.created_at,
            events=[
                EventOut(to_status=e.to_status, label=LABELS[e.to_status], note=e.note, created_at=e.created_at)
                for e in r.events
                if e.visible_to_client or not client_view
            ],
        )


class QuoteCreate(BaseModel):
    entity_fees: int = Field(ge=0)
    service_fee: int = Field(gt=0)
    shipping_fee: int = Field(default=0, ge=0)
    estimated_days_note: str = Field(min_length=5, max_length=200)
    valid_days: int = Field(default=5, ge=1, le=30)
