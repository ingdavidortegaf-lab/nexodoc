from datetime import UTC, datetime
from uuid import UUID

import jwt
from fastapi import APIRouter, Cookie, HTTPException, Request, Response, status
from sqlalchemy import select

from app.api.deps import DB, client_ip
from app.core.security import (
    REFRESH_COOKIE,
    clear_session_cookies,
    decode_token,
    hash_password,
    set_session_cookies,
    verify_password,
)
from app.models import User
from app.schemas.auth import LoginIn, RegisterIn
from app.services.audit import audit

router = APIRouter(prefix="/auth", tags=["auth"])
_DUMMY_HASH = hash_password("no-existe-este-usuario")


@router.post("/login", status_code=204)
async def login(body: LoginIn, request: Request, response: Response, db: DB) -> None:
    user = await db.scalar(select(User).where(User.email == body.email.lower()))
    # Verificar siempre un hash para no revelar si el correo existe (tiempo constante)
    ok = verify_password(body.password, user.password_hash if user and user.password_hash else _DUMMY_HASH)
    if not (user and user.password_hash and ok and user.is_active):
        await audit(db, action="auth.login_failed", target_type="user", target_id=body.email.lower()[:3] + "***", ip=client_ip(request))
        await db.commit()
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Correo o contraseña incorrectos")
    user.last_login_at = datetime.now(UTC)
    await audit(db, action="auth.login", target_type="user", target_id=str(user.id), actor_id=user.id, ip=client_ip(request))
    await db.commit()
    set_session_cookies(response, str(user.id), user.role.value)


@router.post("/register", status_code=410)
async def register(body: RegisterIn) -> dict:
    """
    Deshabilitado. La versión anterior asignaba contraseña a cualquier correo con
    solicitudes SIN verificar el correo, lo que permitía tomar cuentas ajenas.
    Los clientes consultan su pedido con número + correo (POST /v1/track).
    Para reactivar el portal: enviar un enlace de un solo uso al correo y fijar la
    contraseña sólo después de abrirlo.
    """
    raise HTTPException(status.HTTP_410_GONE, "El registro en el portal no está disponible. Consulta tu pedido con el número y tu correo.")


@router.post("/refresh", status_code=204)
async def refresh(response: Response, db: DB, nx_refresh: str | None = Cookie(default=None, alias=REFRESH_COOKIE)) -> None:
    if not nx_refresh:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Sesión requerida")
    try:
        data = decode_token(nx_refresh, "refresh")
    except jwt.PyJWTError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Sesión vencida") from None
    user = await db.get(User, UUID(data["sub"]))
    if not user or not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Usuario no disponible")
    set_session_cookies(response, str(user.id), user.role.value)


@router.post("/logout", status_code=204)
async def logout(response: Response) -> None:
    clear_session_cookies(response)
