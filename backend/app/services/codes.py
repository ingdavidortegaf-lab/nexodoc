from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import ORDER_CODE_SEQ


def format_order_code(year: int, number: int) -> str:
    return f"ND-{year}-{number:06d}"


def item_code(order_code: str, index: int) -> str:
    """Código de cada documento del pedido: ND-2026-000123-01."""
    return f"{order_code}-{index:02d}"


async def next_order_code(db: AsyncSession) -> str:
    """ND-AAAA-NNNNNN con una secuencia de PostgreSQL: sin duplicados aunque lleguen pedidos simultáneos."""
    number = await db.scalar(select(ORDER_CODE_SEQ.next_value()))
    return format_order_code(datetime.now(UTC).year, int(number))
