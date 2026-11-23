import hmac
import ipaddress
from typing import Annotated
from uuid import UUID

import jwt
from fastapi import Cookie, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.database import get_db
from app.core.security import ACCESS_COOKIE, decode_token
from app.models import User
from app.models.entities import ROLE_RANK, Role

DB = Annotated[AsyncSession, Depends(get_db)]

PROXY_SECRET_HEADER = "x-nexodoc-proxy-secret"
CLIENT_IP_HEADER = "x-nexodoc-client-ip"


def _valid_ip(value: str | None) -> str | None:
    if not value:
        return None
    try:
        return str(ipaddress.ip_address(value.strip()))
    except ValueError:
        return None


def client_ip(request: Request) -> str | None:
    """
    IP real del titular, que se guarda como prueba del consentimiento.

    Las cabeceras de IP se pueden falsificar, así que sólo se aceptan de fuentes de confianza:
      1. El frontend (BFF) la envía junto con PROXY_SECRET, un secreto compartido.
      2. Cloudflare (`cf-connecting-ip`), sólo si TRUST_CLOUDFLARE=true y la API no es accesible directamente.
    En otro caso se usa la IP de la conexión.
    """
    s = get_settings()
    secret = request.headers.get(PROXY_SECRET_HEADER, "")
    if s.proxy_secret and secret and hmac.compare_digest(secret, s.proxy_secret):
        ip = _valid_ip(request.headers.get(CLIENT_IP_HEADER))
        if ip:
            return ip
    if s.trust_cloudflare:
        ip = _valid_ip(request.headers.get("cf-connecting-ip"))
        if ip:
            return ip
    return request.client.host if request.client else None


async def current_user(db: DB, nx_access: Annotated[str | None, Cookie(alias=ACCESS_COOKIE)] = None) -> User:
    if not nx_access:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Sesión requerida")
    try:
        data = decode_token(nx_access, "access")
    except jwt.PyJWTError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Sesión inválida o vencida") from None
    user = await db.get(User, UUID(data["sub"]))
    if not user or not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Usuario no disponible")
    return user


CurrentUser = Annotated[User, Depends(current_user)]


def require_role(minimum: Role):
    async def checker(user: CurrentUser) -> User:
        if ROLE_RANK[user.role] < ROLE_RANK[minimum]:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Permisos insuficientes")
        return user

    return checker
