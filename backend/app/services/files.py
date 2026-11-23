"""
Validación de archivos subidos: lista blanca, detección por firma binaria
(no por extensión ni por el Content-Type que envía el navegador), límite de
tamaño y nombre aleatorio. Sin dependencias externas.
"""
from __future__ import annotations

import hashlib
import re
import secrets
from dataclasses import dataclass

SIGNATURES: dict[str, tuple[bytes, str]] = {
    "application/pdf": (b"%PDF-", ".pdf"),
    "image/png": (b"\x89PNG\r\n\x1a\n", ".png"),
    "image/jpeg": (b"\xff\xd8\xff", ".jpg"),
}


class FileRejected(ValueError):
    pass


_PDF_NAME_HEX = re.compile(rb"#([0-9A-Fa-f]{2})")
_PDF_ACTIVE = re.compile(rb"/(JavaScript|JS|Launch|EmbeddedFile|OpenAction\s*<<[^>]*/S\s*/JavaScript)\b")


def _has_active_content(content: bytes) -> bool:
    """Busca acciones activas también cuando el nombre viene ofuscado con escapes (#4A#53 = JS)."""
    normalized = _PDF_NAME_HEX.sub(lambda m: bytes([int(m.group(1), 16)]), content)
    return bool(_PDF_ACTIVE.search(normalized))


@dataclass(frozen=True)
class ValidatedFile:
    mime: str
    extension: str
    size: int
    sha256: str
    storage_key: str


def validate_upload(content: bytes, *, request_code: str, max_mb: int = 10) -> ValidatedFile:
    size = len(content)
    if size == 0:
        raise FileRejected("El archivo está vacío.")
    if size > max_mb * 1024 * 1024:
        raise FileRejected(f"El archivo supera el máximo de {max_mb} MB.")

    for mime, (magic, ext) in SIGNATURES.items():
        if content.startswith(magic):
            break
    else:
        raise FileRejected("Formato no permitido. Usa PDF, JPG o PNG.")

    if mime == "application/pdf" and _has_active_content(content):
        raise FileRejected("El PDF contiene elementos activos no permitidos.")

    digest = hashlib.sha256(content).hexdigest()
    key = f"solicitudes/{request_code}/{secrets.token_urlsafe(16)}{ext}"
    return ValidatedFile(mime=mime, extension=ext, size=size, sha256=digest, storage_key=key)
