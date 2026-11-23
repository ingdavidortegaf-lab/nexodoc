"""Prueba de punta a punta de la API de pedidos y pagos contra un PostgreSQL temporal."""
import asyncio
import hashlib
import os
import sys
import tempfile
from urllib.parse import parse_qs, urlparse

import pgserver
from cryptography.fernet import Fernet

srv = pgserver.get_server(tempfile.mkdtemp(), cleanup_mode="stop")
uri = srv.get_uri().replace("postgresql://", "postgresql+asyncpg://")
os.environ.update(
    DATABASE_URL=uri,
    ENVIRONMENT="development",
    FIELD_ENCRYPTION_KEY=Fernet.generate_key().decode(),
    WOMPI_ENABLED="true",
    WOMPI_PUBLIC_KEY="pub_test_abc",
    WOMPI_INTEGRITY_SECRET="test_integrity",
    WOMPI_EVENTS_SECRET="test_events",
    PROXY_SECRET="p" * 40,
    PUBLIC_SITE_URL="https://www.ejemplo.co",
)
sys.path.insert(0, sys.argv[1])

import httpx  # noqa: E402
from sqlalchemy import select  # noqa: E402

from app.core.database import SessionLocal, engine  # noqa: E402
from app.core.security import hash_password  # noqa: E402
from app.main import app  # noqa: E402
from app.models import Base, Consent, Payment, Service, ServiceCategory, User  # noqa: E402
from app.models.entities import Role  # noqa: E402

ok = 0

# Captura los avisos (correo/WhatsApp) en lugar de enviarlos
import app.api.v1.admin as _admin  # noqa: E402
import app.api.v1.orders as _orders  # noqa: E402
import app.api.v1.payments as _payments  # noqa: E402

sent = []


async def _fake_notify(n):
    sent.append(n)


for _m in (_admin, _orders, _payments):
    _m.notify = _fake_notify


def check(cond, label):
    global ok
    if not cond:
        raise AssertionError(label)
    ok += 1
    print("  ✓", label)


def event(tx_id, status, cents, reference):
    ts = 1763800000
    raw = f"{tx_id}{status}{cents}{ts}test_events"
    return {
        "event": "transaction.updated",
        "data": {"transaction": {"id": tx_id, "status": status, "amount_in_cents": cents, "reference": reference,
                                 "currency": "COP", "payment_method_type": "PSE"}},
        "signature": {"properties": ["transaction.id", "transaction.status", "transaction.amount_in_cents"],
                      "checksum": hashlib.sha256(raw.encode()).hexdigest()},
        "timestamp": ts,
    }


async def main():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async with SessionLocal() as db:
        cat = ServiceCategory(slug="registros-civiles", name="Registros civiles")
        cat2 = ServiceCategory(slug="inmobiliarios", name="Inmobiliarios")
        db.add_all([cat, cat2])
        await db.flush()
        db.add_all([
            Service(category_id=cat.id, slug="registro-civil-de-nacimiento", name="Copia de registro civil de nacimiento",
                    entity="Registraduría", modality="remota", verification_fee=15000),
            Service(category_id=cat2.id, slug="certificado-de-tradicion-y-libertad", name="Certificado de tradición y libertad",
                    entity="SNR", modality="remota", verification_fee=0),
            User(email="operador@example.com", full_name="Operador Prueba", phone="3000000000", city="Yopal",
                 document_type="CC", document_number_enc="x", document_number_idx="x", role=Role.OPERATOR,
                 password_hash=hash_password("operador-prueba-123")),
        ])
        await db.commit()

    proxy = {"X-Nexodoc-Proxy-Secret": "p" * 40, "X-Nexodoc-Client-IP": "190.24.10.7"}
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://api.test") as c:
        print("Pedido")
        body = {
            "applicantType": "persona", "fullName": "Ana María Pérez", "documentType": "CC", "documentNumber": "1032456789",
            "email": "Ana@Example.com", "phone": "+57 300 123 4567", "city": "Yopal", "company": "",
            "shipping": {"recipient": "Ana María Pérez", "address": "Calle 10 # 20-30", "city": "Yopal", "country": "Colombia"},
            "items": [
                {"service": "registro-civil-de-nacimiento", "fields": {"tipo_registro": "Nacimiento", "indicativo_serial": "12345678", "entrega": "local"}},
                {"service": "certificado-de-tradicion-y-libertad", "fields": {"matricula": "470-12345", "entrega": "digital"}},
            ],
            "dataConsent": True, "termsConsent": True, "marketingConsent": False, "policyVersion": "2026-11-22",
        }
        r = await c.post("/v1/orders", json=body, headers=proxy)
        check(r.status_code == 201, f"crea pedido (201) → {r.status_code} {r.text[:200]}")
        order = r.json()
        code = order["code"]
        check(order["payment"] == {"required": True, "amount": 15000, "enabled": True}, "verificación calculada en servidor: 15.000")
        check([i["code"] for i in order["items"]] == [f"{code}-01", f"{code}-02"], "códigos de documento -01 y -02")

        tampered = {**body, "items": [{"service": "no-existe", "fields": {}}]}
        r = await c.post("/v1/orders", json=tampered, headers=proxy)
        check(r.status_code == 422, "rechaza servicio inexistente")

        async with SessionLocal() as db:
            consent = await db.scalar(select(Consent).limit(1))
            check(str(consent.ip) == "190.24.10.7", "IP del consentimiento = IP real enviada por el BFF")
        r = await c.post("/v1/orders", json=body, headers={"X-Nexodoc-Proxy-Secret": "malo", "X-Nexodoc-Client-IP": "1.2.3.4"})
        async with SessionLocal() as db:
            ips = {str(x.ip) for x in await db.scalars(select(Consent))}
            check("1.2.3.4" not in ips, "ignora IP enviada sin el secreto del proxy")

        print("Consulta")
        r = await c.post("/v1/track", json={"code": code, "email": "otra@example.com"})
        check(r.status_code == 404, "correo incorrecto → 404 sin revelar el pedido")
        r = await c.post("/v1/track", json={"code": code, "email": "ana@example.com"})
        check(r.status_code == 200, "consulta con número + correo")
        t = r.json()
        check(all(i["status"] == "awaiting_verification" for i in t["items"]), "estado inicial: pendiente de pago de verificación")
        check(t["verification_payable"] is True, "verificación pagable")

        print("Pago de verificación (Wompi)")
        r = await c.post("/v1/payments/checkout", json={"code": code, "email": "ana@example.com", "purpose": "verification"})
        check(r.status_code == 200, f"crea checkout → {r.status_code} {r.text[:200]}")
        co = r.json()
        q = parse_qs(urlparse(co["url"]).query)
        check(q["amount-in-cents"] == ["1500000"], "monto en centavos 1.500.000")
        expected_sig = hashlib.sha256(f"{co['reference']}1500000COPtest_integrity".encode()).hexdigest()
        check(q["signature:integrity"] == [expected_sig], "firma de integridad correcta")
        check(q["redirect-url"] == ["https://www.ejemplo.co/pago/resultado"], "regresa a /pago/resultado")

        bad = event("tx-1", "APPROVED", 1500000, co["reference"])
        bad["signature"]["checksum"] = "0" * 64
        r = await c.post("/v1/payments/wompi/events", json=bad)
        check(r.status_code == 401, "webhook con firma inválida → 401")

        r = await c.post("/v1/payments/wompi/events", json=event("tx-1", "APPROVED", 1500000, co["reference"]))
        check(r.status_code == 200, "webhook firmado aceptado")
        r = await c.post("/v1/payments/wompi/events", json=event("tx-1", "APPROVED", 1500000, co["reference"]))
        check(r.status_code == 200, "webhook repetido (idempotente)")
        t = (await c.post("/v1/track", json={"code": code, "email": "ana@example.com"})).json()
        check(all(i["status"] == "received" for i in t["items"]), "pago aprobado → documentos «Recibida»")
        check(t["verification_paid"] and not t["verification_payable"], "verificación marcada como pagada")
        check(sum(1 for i in t["items"][0]["events"] if i["to_status"] == "received") == 1, "la transición ocurre una sola vez")

        r = await c.post("/v1/payments/checkout", json={"code": code, "email": "ana@example.com", "purpose": "verification"})
        check(r.status_code == 409, "no permite pagar dos veces la verificación")

        print("Gestión y cotización")
        r = await c.post("/v1/auth/login", json={"email": "operador@example.com", "password": "operador-prueba-123"})
        check(r.status_code == 204, f"operador inicia sesión → {r.status_code} {r.text[:120]}")
        c.cookies.set("nx_access", r.cookies.get("nx_access"))
        item = f"{code}-01"
        r = await c.get("/v1/admin/orders", params={"q": "ana@"})
        check(r.status_code == 200 and any(o["code"] == code for o in r.json()), "panel: lista y búsqueda de pedidos")
        r = await c.get(f"/v1/admin/orders/{code}")
        d = r.json()
        check(r.status_code == 200 and d["applicant"]["document_number"] == "1032456789", "panel: detalle con documento descifrado")
        check([s["code"] for s in d["items"][0]["next_states"]] == ["in_review", "rejected_cancelled"], "panel: siguientes estados permitidos")
        check(d["items"][0]["fields"]["indicativo_serial"] == "12345678", "panel: campos del formulario del documento")
        r = await c.post(f"/v1/admin/requests/{item}/files", files={"file": ("doc.pdf", b"%PDF-1.4 x", "application/pdf")}, data={"kind": "documento_final"})
        check(r.status_code == 503, "panel: subir documento sin almacenamiento configurado → 503 claro")
        r = await c.patch(f"/v1/admin/requests/{item}/status", json={"to": "confirmed"})
        check(r.status_code == 409, "operador no puede saltar a «Confirmada»")
        for to in ("in_review", "quoting"):
            r = await c.patch(f"/v1/admin/requests/{item}/status", json={"to": to})
            check(r.status_code == 200, f"operador → {to}")
        r = await c.post(f"/v1/admin/requests/{item}/quote",
                         json={"entity_fees": 10800, "service_fee": 40000, "shipping_fee": 8000, "estimated_days_note": "Según la notaría: 3 a 5 días hábiles"})
        check(r.status_code == 201 and r.json()["total"] == 10800 + 40000 + 7600 + 8000, "cotización con IVA del honorario")
        c.cookies.clear()
        r = await c.get("/v1/admin/orders")
        check(r.status_code == 401, "panel exige sesión de operador")
        messages = [n.message for n in sent if n.order_code == code]
        check(any("Recibimos tu pedido" in m for m in messages), "aviso al crear el pedido")
        check(any("verificación" in m for m in messages), "aviso al aprobarse el pago de verificación")
        check(any("cotización está lista" in m for m in messages), "aviso de cotización lista")

        t = (await c.post("/v1/track", json={"code": code, "email": "ana@example.com"})).json()
        quote = t["items"][0]["quote"]
        check(quote["credited"] == 15000 and quote["amount_due"] == 66400 - 15000, "saldo descuenta la verificación (51.400)")
        check(quote["payable"] is True, "cotización pagable")

        r = await c.post("/v1/payments/checkout", json={"code": code, "email": "ana@example.com", "purpose": "quote", "item": item})
        check(r.status_code == 200, "checkout de la cotización")
        co2 = r.json()
        check(co2["amount"] == 51400, "monto del saldo 51.400")

        r = await c.post("/v1/payments/wompi/events", json=event("tx-2", "APPROVED", 999, co2["reference"]))
        async with SessionLocal() as db:
            p = await db.scalar(select(Payment).where(Payment.reference == co2["reference"]))
            check(p.status == "error", "monto alterado → pago en error, sin confirmar")
        r = await c.post("/v1/payments/checkout", json={"code": code, "email": "ana@example.com", "purpose": "quote", "item": item})
        co3 = r.json()
        await c.post("/v1/payments/wompi/events", json=event("tx-3", "APPROVED", 5140000, co3["reference"]))
        t = (await c.post("/v1/track", json={"code": code, "email": "ana@example.com"})).json()
        check(t["items"][0]["status"] == "confirmed", "pago de cotización → «Confirmada»")
        check(t["items"][1]["status"] == "received", "el otro documento sigue su propio flujo")
        check(t["items"][0]["quote"]["amount_due"] == 0, "saldo en cero")

        print("Concurrencia y seguridad")
        rs = await asyncio.gather(*[c.post("/v1/orders", json=body, headers={**proxy, "X-Nexodoc-Client-IP": f"10.0.0.{i}"}) for i in range(8)])
        codes = [x.json()["code"] for x in rs if x.status_code == 201]
        check(len(codes) == 8 and len(set(codes)) == 8, "8 pedidos simultáneos con códigos únicos")
        r = await c.post("/v1/auth/register", json={"email": "ana@example.com", "password": "otraclave123", "full_name": "Atacante"})
        check(r.status_code == 410, "registro sin verificación deshabilitado (410)")
        r = await c.post("/v1/orders/" + code + "/items/" + item + "/files", files={"file": ("a.pdf", b"%PDF-1.4", "application/pdf")})
        check(r.status_code == 401, "carga de archivos exige token del pedido")

    print(f"\n{ok} comprobaciones OK")
    await engine.dispose()


asyncio.run(main())
