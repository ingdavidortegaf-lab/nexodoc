import asyncio

from app.core.config import Settings
from app.services import notify as notify_mod
from app.services.notify import Notice, render_email, whatsapp_number

N = Notice(email="ana@example.com", phone="300 123 4567", first_name="Ana", order_code="ND-2026-000001",
           document="Copia de escritura pública", status_label="Recibida", message="Recibimos tu pedido <b>.")


def test_email_has_order_status_link_and_escapes_html():
    subject, text, body = render_email(N)
    assert subject == "Pedido ND-2026-000001: Recibida"
    assert "/estado?codigo=ND-2026-000001" in text and "/estado?codigo=ND-2026-000001" in body
    assert "<b>." not in body and "&lt;b&gt;." in body


def test_whatsapp_number_adds_colombia_prefix():
    assert whatsapp_number("300 123 4567") == "573001234567"
    assert whatsapp_number("+1 (305) 555-0100") == "13055550100"


def test_notify_never_raises_when_a_channel_fails(monkeypatch):
    async def boom(_):
        raise RuntimeError("proveedor caído")

    monkeypatch.setattr(notify_mod, "send_email", boom)
    monkeypatch.setattr(notify_mod, "send_whatsapp", boom)
    asyncio.run(notify_mod.notify(N))  # no lanza excepción


def test_channels_are_skipped_when_not_configured(monkeypatch):
    monkeypatch.setattr(notify_mod, "get_settings", lambda: Settings())
    assert asyncio.run(notify_mod.send_email(N)) is False
