from typing import Any
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.models import AuditLog


async def audit(
    db: AsyncSession,
    *,
    action: str,
    target_type: str,
    target_id: str,
    actor_id: UUID | None = None,
    ip: str | None = None,
    meta: dict[str, Any] | None = None,
) -> None:
    """Registra una acción. Nunca guardar aquí datos personales en claro."""
    db.add(AuditLog(action=action, target_type=target_type, target_id=target_id, actor_id=actor_id, ip=ip, meta=meta or {}))
