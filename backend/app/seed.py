"""
Crea las tablas (desarrollo) y carga el catálogo desde el frontend, para
mantener una sola fuente de verdad (incluidos los valores de verificación).

  python -m app.seed ../frontend/catalog.json

El JSON se genera con:  cd frontend && npx tsx scripts/export-catalog.ts > catalog.json
Volver a ejecutarlo actualiza nombres, entidades y precios de los servicios existentes.
En producción usa migraciones de Alembic en lugar de create_all.
"""
import asyncio
import json
import sys

from sqlalchemy import select

from app.core.database import SessionLocal, engine
from app.models import Base, Service, ServiceCategory


async def main(path: str) -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    with open(path, encoding="utf-8") as fh:
        data = json.load(fh)
    async with SessionLocal() as db:
        for c in data:
            cat = await db.scalar(select(ServiceCategory).where(ServiceCategory.slug == c["slug"]))
            if not cat:
                cat = ServiceCategory(slug=c["slug"], name=c["name"])
                db.add(cat)
                await db.flush()
            cat.name = c["name"]
            for s in c["services"]:
                svc = await db.scalar(select(Service).where(Service.slug == s["slug"]))
                if not svc:
                    svc = Service(category_id=cat.id, slug=s["slug"])
                    db.add(svc)
                svc.name, svc.entity, svc.modality = s["name"], s["entity"], s["modality"]
                svc.verification_fee = int(s.get("verificationFee") or 0)
                svc.price_from = s.get("priceFrom")
        await db.commit()
    print(f"Catálogo cargado: {len(data)} categorías")


if __name__ == "__main__":
    asyncio.run(main(sys.argv[1] if len(sys.argv) > 1 else "catalog.json"))
