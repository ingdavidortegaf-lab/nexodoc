"""
Avisos al cliente por correo y WhatsApp cuando cambia su pedido.

- Correo: Resend (EMAIL_PROVIDER=resend, RESEND_API_KEY, EMAIL_FROM).
- WhatsApp: plantilla aprobada por Meta (WHATSAPP_ENABLED=true, WHATSAPP_TOKEN,
  WHATSAPP_PHONE_ID, WHATSAPP_TEMPLATE_STATUS). La plantilla debe tener 4
  variables: nombre, número de pedido, documento y estado.

Si un canal no está configurado, se omite en silencio. Un fallo de envío nunca
interrumpe la operación: se registra en el log y el pedido sigue su curso.
Los mensajes no incluyen datos sensibles: sólo el número de pedido, el
documento y el estado, con el enlace a la consulta.
"""
from __future__ import annotations

import html
import logging
from dataclasses import dataclass

import httpx

from app.core.config import get_settings
from app.services.integrations import WhatsAppNotifier

log = logging.getLogger("nexodoc.notify")


@dataclass(frozen=True)
class Notice:
    email: str
    phone: str
    first_name: str
    order_code: str
    document: str
    status_label: str
    message: str  # una o dos frases para el cliente


def track_url(order_code: str) -> str:
    return f"{get_settings().public_site_url.rstrip('/')}/estado?codigo={order_code}"


def render_email(n: Notice) -> tuple[str, str, str]:
    """(asunto, texto, html) del correo."""
    subject = f"Pedido {n.order_code}: {n.status_label}"
    url = track_url(n.order_code)
    text = (
        f"Hola, {n.first_name}:\n\n{n.message}\n\n"
        f"Pedido: {n.order_code}\nDocumento: {n.document}\nEstado: {n.status_label}\n\n"
        f"Consulta el detalle en {url} con tu número de pedido y este correo.\n\nNEXODOC"
    )
    e = html.escape
    body = f"""<!doctype html><html lang="es"><body style="margin:0;background:#f4f7fa;font-family:Arial,Helvetica,sans-serif;color:#10243a">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;padding:32px">
<tr><td style="font-size:20px;font-weight:bold">NEXODOC</td></tr>
<tr><td style="padding-top:20px;font-size:16px;line-height:1.55">Hola, {e(n.first_name)}:<br><br>{e(n.message)}</td></tr>
<tr><td style="padding-top:20px"><table role="presentation" width="100%" style="background:#f4f7fa;border-radius:12px;padding:16px;font-size:14px;line-height:1.7">
<tr><td style="color:#64748b">Pedido</td><td align="right"><b>{e(n.order_code)}</b></td></tr>
<tr><td style="color:#64748b">Documento</td><td align="right">{e(n.document)}</td></tr>
<tr><td style="color:#64748b">Estado</td><td align="right"><b>{e(n.status_label)}</b></td></tr></table></td></tr>
<tr><td style="padding-top:24px"><a href="{e(url)}" style="display:inline-block;background:#10243a;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:bold">Ver estado del pedido</a></td></tr>
<tr><td style="padding-top:24px;font-size:12px;color:#64748b">NEXODOC es una empresa privada de gestión documental; los documentos los expide la entidad responsable.</td></tr>
</table></td></tr></table></body></html>"""
    return subject, text, body


async def send_email(n: Notice) -> bool:
    s = get_settings()
    if s.email_provider != "resend" or not (s.resend_api_key and s.email_from):
        return False
    subject, text, body = render_email(n)
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {s.resend_api_key}"},
            json={"from": s.email_from, "to": [n.email], "subject": subject, "text": text, "html": body},
        )
        r.raise_for_status()
    return True


def whatsapp_number(phone: str) -> str:
    """Formato internacional sin "+". Un celular colombiano de 10 dígitos recibe el 57."""
    digits = "".join(ch for ch in phone if ch.isdigit())
    if len(digits) == 10 and digits.startswith("3"):
        return f"57{digits}"
    return digits


async def send_whatsapp(n: Notice) -> bool:
    s = get_settings()
    wa = WhatsAppNotifier()
    if not wa.enabled or not s.whatsapp_template_status:
        return False
    params = {"nombre": n.first_name, "pedido": n.order_code, "documento": n.document, "estado": n.status_label}
    await wa.send(whatsapp_number(n.phone), s.whatsapp_template_status, params)
    return True


async def notify(n: Notice) -> None:
    """Envía por todos los canales configurados. Pensado para BackgroundTasks."""
    for channel, fn in (("email", send_email), ("whatsapp", send_whatsapp)):
        try:
            await fn(n)
        except Exception:  # noqa: BLE001 — un aviso fallido no debe afectar el pedido
            log.warning("No se pudo enviar el aviso por %s del pedido %s", channel, n.order_code, exc_info=True)
