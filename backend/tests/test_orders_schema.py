import pytest
from pydantic import ValidationError

from app.core.config import Settings
from app.schemas.orders import OrderItemIn
from app.services.ratelimit import SlidingWindowLimiter


def test_item_fields_are_cleaned_and_empty_dropped():
    item = OrderItemIn(service="registro-civil-de-nacimiento", fields={"nombre": " Ana\x00 Pérez ", "vacio": "  "})
    assert item.fields == {"nombre": "Ana  Pérez"}


@pytest.mark.parametrize("key", ["Nombre", "1campo", "con-guion", "x" * 41])
def test_item_rejects_invalid_field_keys(key):
    with pytest.raises(ValidationError):
        OrderItemIn(service="registro-civil-de-nacimiento", fields={key: "valor"})


def test_item_rejects_too_many_fields():
    with pytest.raises(ValidationError):
        OrderItemIn(service="otro", fields={f"c{i}": "v" for i in range(41)})


def test_limiter_blocks_after_limit_and_recovers():
    lim = SlidingWindowLimiter(limit=2, window_seconds=10)
    assert lim.allow("k", now=0) and lim.allow("k", now=1)
    assert not lim.allow("k", now=2)
    assert lim.allow("k", now=11.5)


def test_typo_environment_is_treated_as_production():
    s = Settings(environment="prod")
    assert s.is_production
    with pytest.raises(RuntimeError):
        s.assert_secure()


def test_cors_origins_plain_env_value(monkeypatch):
    monkeypatch.setenv("CORS_ORIGINS", "http://localhost:3000, https://www.ejemplo.co")
    assert Settings().cors_origin_list == ["http://localhost:3000", "https://www.ejemplo.co"]
