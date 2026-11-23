from fastapi import APIRouter
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api.deps import DB
from app.models import ServiceCategory

router = APIRouter(prefix="/catalog", tags=["catalog"])


@router.get("/categories")
async def categories(db: DB) -> list[dict]:
    rows = await db.scalars(
        select(ServiceCategory).options(selectinload(ServiceCategory.services)).where(ServiceCategory.is_active.is_(True))
    )
    return [
        {
            "slug": c.slug,
            "name": c.name,
            "services": [
                {"slug": s.slug, "name": s.name, "entity": s.entity, "modality": s.modality}
                for s in c.services
                if s.is_active
            ],
        }
        for c in rows
    ]
