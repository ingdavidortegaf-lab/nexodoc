import pytest

from app.services.files import FileRejected, validate_upload


def test_accepts_pdf_and_randomizes_name():
    f = validate_upload(b"%PDF-1.7\n...", request_code="ND-2026-000001")
    assert f.mime == "application/pdf"
    assert f.storage_key.startswith("solicitudes/ND-2026-000001/") and f.storage_key.endswith(".pdf")


def test_rejects_executable_disguised_as_pdf():
    with pytest.raises(FileRejected):
        validate_upload(b"MZ\x90\x00 fake.pdf", request_code="X")


def test_rejects_pdf_with_javascript():
    with pytest.raises(FileRejected):
        validate_upload(b"%PDF-1.4 /JavaScript (app.alert(1))", request_code="X")


def test_rejects_oversized():
    with pytest.raises(FileRejected):
        validate_upload(b"\x89PNG\r\n\x1a\n" + b"0" * (2 * 1024 * 1024), request_code="X", max_mb=1)


def test_rejects_pdf_with_obfuscated_javascript_name():
    with pytest.raises(FileRejected):
        validate_upload(b"%PDF-1.4 /#4A#53 (app.alert(1))", request_code="X")
