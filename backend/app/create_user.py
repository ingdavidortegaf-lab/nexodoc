"""
Crea o actualiza una cuenta del equipo (gestor, supervisor o administrador).

  python -m app.create_user correo@tudominio.co --rol operator --nombre "Nombre Apellido"

La contraseña se pide por consola (no queda en el historial ni en la base en claro).
Roles: operator (gestor), supervisor, admin.
"""
import argparse
import asyncio
import getpass

from sqlalchemy import select

from app.core.database import SessionLocal, engine
from app.core.security import hash_password
from app.models import User
from app.models.entities import Role


async def main(email: str, role: Role, name: str) -> None:
    password = getpass.getpass("Contraseña (mínimo 12 caracteres): ")
    if len(password) < 12 or password != getpass.getpass("Repite la contraseña: "):
        raise SystemExit("Las contraseñas no coinciden o tienen menos de 12 caracteres.")
    async with SessionLocal() as db:
        user = await db.scalar(select(User).where(User.email == email.lower()))
        if user is None:
            user = User(email=email.lower(), full_name=name, phone="", city="", document_type="CC",
                        document_number_enc="-", document_number_idx="-")
            db.add(user)
        user.full_name = name or user.full_name
        user.role = role
        user.is_active = True
        user.password_hash = hash_password(password)
        await db.commit()
    await engine.dispose()
    print(f"Cuenta lista: {email.lower()} ({role.value})")


if __name__ == "__main__":
    p = argparse.ArgumentParser(description="Crea una cuenta del equipo de NEXODOC")
    p.add_argument("email")
    p.add_argument("--rol", choices=[r.value for r in Role if r != Role.CLIENT], default="operator")
    p.add_argument("--nombre", default="")
    a = p.parse_args()
    asyncio.run(main(a.email, Role(a.rol), a.nombre or a.email.split("@")[0]))
