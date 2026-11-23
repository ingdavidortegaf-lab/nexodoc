"""
Adaptadores de integración. Cada uno se activa por variable de entorno; si
está apagado, `enabled` es False y la interfaz no ofrece la opción. Ninguno
simula respuestas.
"""
from __future__ import annotations

import hashlib
import hmac
import json
from typing import Any, Protocol

import httpx

from app.core.config import get_settings


class Notifier(Protocol):
    enabled: bool

    async def send(self, to: str, template: str, params: dict[str, str]) -> None: ...


class WhatsAppNotifier:
    """WhatsApp Business Cloud API (plantillas aprobadas por Meta)."""

    def __init__(self) -> None:
        s = get_settings()
        self.enabled = s.whatsapp_enabled and bool(s.whatsapp_token and s.whatsapp_phone_id)
        self._token, self._phone_id = s.whatsapp_token, s.whatsapp_phone_id

    async def send(self, to: str, template: str, params: dict[str, str]) -> None:
        if not self.enabled:
            return
        body = {
            "messaging_product": "whatsapp",
            "to": to,
            "type": "template",
            "template": {
                "name": template,
                "language": {"code": "es"},
                "components": [{"type": "body", "parameters": [{"type": "text", "text": v} for v in params.values()]}],
            },
        }
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.post(
                f"https://graph.facebook.com/v21.0/{self._phone_id}/messages",
                headers={"Authorization": f"Bearer {self._token}"},
                json=body,
            )
            r.raise_for_status()


async def emit_n8n(event: str, payload: dict[str, Any]) -> None:
    """Webhook firmado (HMAC-SHA256) hacia n8n. Sin datos sensibles en el payload."""
    s = get_settings()
    if not (s.n8n_webhook_url and s.n8n_webhook_secret):
        return
    data = json.dumps({"event": event, **payload}, separators=(",", ":")).encode()
    sig = hmac.new(s.n8n_webhook_secret.encode(), data, hashlib.sha256).hexdigest()
    async with httpx.AsyncClient(timeout=5) as client:
        await client.post(s.n8n_webhook_url, content=data, headers={"Content-Type": "application/json", "X-Nexodoc-Signature": sig})


def verify_wompi_event(event: dict[str, Any], received_checksum: str) -> bool:
    """
    Verifica la firma de eventos de Wompi: SHA256 de los valores indicados en
    signature.properties + timestamp + secreto de eventos.
    """
    s = get_settings()
    if not (s.wompi_enabled and s.wompi_events_secret):
        return False
    try:
        props = event["signature"]["properties"]
        values = []
        for path in props:
            node: Any = event["data"]
            for part in path.split("."):
                node = node[part]
            values.append(str(node))
        raw = "".join(values) + str(event["timestamp"]) + s.wompi_events_secret
    except (KeyError, TypeError):
        return False
    return hmac.compare_digest(hashlib.sha256(raw.encode()).hexdigest(), received_checksum)
