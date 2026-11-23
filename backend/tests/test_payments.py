import hashlib
from urllib.parse import parse_qs, urlparse

import pytest

from app.core.config import Settings, get_settings
from app.services import integrations
from app.services.payments import api_base, checkout_url, integrity_signature, new_reference


def test_integrity_signature_matches_wompi_formula():
    expected = hashlib.sha256(b"ND-2026-000001-VABCD1234" + b"1500000" + b"COP" + b"secreto").hexdigest()
    assert integrity_signature("ND-2026-000001-VABCD1234", 1500000, "COP", "secreto") == expected


def test_api_base_follows_key_environment():
    assert api_base("pub_test_x").startswith("https://sandbox.")
    assert api_base("pub_prod_x").startswith("https://production.")


def test_references_are_unique_and_tagged():
    a, b = new_reference("ND-2026-000001", "verification"), new_reference("ND-2026-000001", "verification")
    assert a != b and "-V" in a
    assert "-Q" in new_reference("ND-2026-000001-01", "quote")


def test_checkout_url_amount_is_in_cents_and_signed():
    s = Settings(wompi_public_key="pub_test_abc", wompi_integrity_secret="sec")
    url = checkout_url(settings=s, reference="R1", amount=15000, redirect_url="https://x.co/pago/resultado",
                       email="a@b.co", full_name="Ana Pérez", phone="+57 300 123 4567", legal_id="123", legal_id_type="CC")
    q = parse_qs(urlparse(url).query)
    assert q["amount-in-cents"] == ["1500000"]
    assert q["signature:integrity"] == [integrity_signature("R1", 1500000, "COP", "sec")]
    assert q["customer-data:phone-number"] == ["3001234567"]


@pytest.fixture
def wompi_settings(monkeypatch):
    s = Settings(wompi_enabled=True, wompi_events_secret="evt_secret")
    monkeypatch.setattr(integrations, "get_settings", lambda: s)
    yield s
    get_settings.cache_clear()


def _event(status="APPROVED"):
    return {
        "event": "transaction.updated",
        "data": {"transaction": {"id": "123-abc", "status": status, "amount_in_cents": 1500000}},
        "signature": {"properties": ["transaction.id", "transaction.status", "transaction.amount_in_cents"]},
        "timestamp": 1700000000,
    }


def test_wompi_event_signature_valid(wompi_settings):
    ev = _event()
    checksum = hashlib.sha256(b"123-abcAPPROVED1500000" + b"1700000000" + b"evt_secret").hexdigest()
    assert integrations.verify_wompi_event(ev, checksum)


def test_wompi_event_signature_rejects_tampering(wompi_settings):
    checksum = hashlib.sha256(b"123-abcDECLINED1500000" + b"1700000000" + b"evt_secret").hexdigest()
    assert not integrations.verify_wompi_event(_event("APPROVED"), checksum)
