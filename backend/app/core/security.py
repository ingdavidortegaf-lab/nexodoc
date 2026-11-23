"""
Contraseñas (Argon2id), tokens JWT de corta duración en cookies httpOnly
y cifrado de campos sensibles (Fernet / AES-128-CBC + HMAC).
"""
from __future__ import annotations

import hashlib
import secrets
from datetime import UTC, datetime, timedelta
from typing import Any

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerifyMismatchError
from cryptography.fernet import Fernet
from fastapi import Response

from app.core.config import get_settings

_hasher = PasswordHasher()  # Argon2id con parámetros recomendados por la librería
ACCESS_COOKIE = "nx_access"
REFRESH_COOKIE = "nx_refresh"


def hash_password(password: str) -> str:
    return _hasher.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    try:
        return _hasher.verify(hashed, password)
    except (VerifyMismatchError, InvalidHashError):
        return False


def _jwt_key() -> str:
    s = get_settings()
    if s.jwt_secret:
        return s.jwt_secret
    if s.is_production:  # assert_secure ya lo impide; doble cerrojo
        raise RuntimeError("JWT_SECRET no está configurado")
    return "solo-desarrollo-no-usar-en-produccion-0000"


def create_token(subject: str, role: str, kind: str, minutes: int) -> str:
    now = datetime.now(UTC)
    payload: dict[str, Any] = {
        "sub": subject,
        "role": role,
        "typ": kind,
        "iat": now,
        "exp": now + timedelta(minutes=minutes),
        "jti": secrets.token_urlsafe(12),
    }
    return jwt.encode(payload, _jwt_key(), algorithm="HS256")


def decode_token(token: str, kind: str) -> dict[str, Any]:
    data = jwt.decode(token, _jwt_key(), algorithms=["HS256"])
    if data.get("typ") != kind:
        raise jwt.InvalidTokenError("Tipo de token incorrecto")
    return data


def set_session_cookies(response: Response, user_id: str, role: str) -> None:
    s = get_settings()
    common = {"httponly": True, "secure": s.is_production, "samesite": "lax", "path": "/"}
    response.set_cookie(
        ACCESS_COOKIE, create_token(user_id, role, "access", s.access_token_minutes), max_age=s.access_token_minutes * 60, **common
    )
    response.set_cookie(
        REFRESH_COOKIE,
        create_token(user_id, role, "refresh", s.refresh_token_days * 1440),
        max_age=s.refresh_token_days * 86400,
        **{**common, "path": "/v1/auth"},
    )


def clear_session_cookies(response: Response) -> None:
    response.delete_cookie(ACCESS_COOKIE, path="/")
    response.delete_cookie(REFRESH_COOKIE, path="/v1/auth")


# --- Cifrado de campos (número de documento de identidad, etc.) -------------
def _fernet() -> Fernet:
    key = get_settings().field_encryption_key
    if not key:
        raise RuntimeError("FIELD_ENCRYPTION_KEY no está configurada")
    return Fernet(key.encode())


def encrypt_field(value: str) -> str:
    return _fernet().encrypt(value.encode()).decode()


def decrypt_field(token: str) -> str:
    return _fernet().decrypt(token.encode()).decode()


def blind_index(value: str) -> str:
    """Hash determinista para buscar por documento sin descifrar (clave propia, no la del JWT)."""
    secret = (get_settings().blind_index_key or "solo-desarrollo-indice-ciego").encode()
    return hashlib.blake2b(value.strip().upper().encode(), key=secret[:64], digest_size=20).hexdigest()


# --- Token de carga de archivos de un pedido recién creado ------------------
def create_upload_token(order_code: str) -> str:
    """Permite adjuntar soportes al pedido durante un tiempo corto, sin cuenta."""
    return create_token(order_code, "order", "upload", get_settings().upload_token_minutes)


def decode_upload_token(token: str) -> str:
    return decode_token(token, "upload")["sub"]
