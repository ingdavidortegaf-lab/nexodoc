"""Configuración tipada desde variables de entorno."""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict

INSECURE_ENVIRONMENTS = {"development", "test"}


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    environment: str = "development"
    database_url: str = "postgresql+asyncpg://nexodoc:nexodoc@localhost:5432/nexodoc"
    jwt_secret: str = ""
    field_encryption_key: str = ""
    # Clave del índice ciego (búsqueda por número de documento). Independiente del JWT
    # para poder rotar uno sin romper el otro.
    blind_index_key: str = ""
    # Lista separada por comas. Se guarda como texto: pydantic-settings intenta leer
    # las listas como JSON y fallaba con "http://localhost:3000".
    cors_origins: str = "http://localhost:3000"

    # URL pública del sitio (redirección después del pago)
    public_site_url: str = "http://localhost:3000"

    # IP real del cliente: el frontend (BFF) la envía firmada con este secreto compartido.
    proxy_secret: str = ""
    # Sólo activar si la API está detrás de Cloudflare y no es accesible directamente.
    trust_cloudflare: bool = False

    access_token_minutes: int = 15
    refresh_token_days: int = 14
    upload_token_minutes: int = 120

    s3_endpoint_url: str = ""
    s3_bucket: str = "nexodoc-documentos"
    s3_access_key_id: str = ""
    s3_secret_access_key: str = ""
    download_url_seconds: int = 300
    max_upload_mb: int = 20
    max_files_per_item: int = 5
    document_retention_days: int = 180

    # El valor de verificación pagado al enviar se descuenta del total de la cotización.
    credit_verification_fee: bool = True

    # Wompi (PSE, tarjetas, Nequi, botón Bancolombia)
    wompi_enabled: bool = False
    wompi_public_key: str = ""
    wompi_integrity_secret: str = ""
    wompi_events_secret: str = ""
    mercadopago_enabled: bool = False
    whatsapp_enabled: bool = False
    whatsapp_token: str = ""
    whatsapp_phone_id: str = ""
    whatsapp_template_status: str = "nexodoc_estado_pedido"
    email_provider: str = ""  # "resend" para activar el correo
    resend_api_key: str = ""
    email_from: str = ""  # p. ej. "NEXODOC <pedidos@tudominio.co>" (dominio verificado en Resend)
    n8n_webhook_url: str = ""
    n8n_webhook_secret: str = ""

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def is_production(self) -> bool:
        return self.environment not in INSECURE_ENVIRONMENTS

    @property
    def wompi_ready(self) -> bool:
        return self.wompi_enabled and bool(self.wompi_public_key and self.wompi_integrity_secret and self.wompi_events_secret)

    def assert_secure(self) -> None:
        """Fuera de desarrollo/pruebas, arrancar sin secretos es un error, no una advertencia.

        Cualquier valor de ENVIRONMENT distinto de development/test se trata como producción,
        así un error tipográfico ("prod", "Production") no deja la API sin protección.
        """
        if not self.is_production:
            return
        missing = []
        if len(self.jwt_secret) < 32:
            missing.append("JWT_SECRET (≥32 caracteres)")
        if not self.field_encryption_key:
            missing.append("FIELD_ENCRYPTION_KEY")
        if len(self.blind_index_key) < 32:
            missing.append("BLIND_INDEX_KEY (≥32 caracteres)")
        if len(self.proxy_secret) < 32:
            missing.append("PROXY_SECRET (≥32 caracteres)")
        if self.wompi_enabled and not self.wompi_ready:
            missing.append("WOMPI_PUBLIC_KEY, WOMPI_INTEGRITY_SECRET y WOMPI_EVENTS_SECRET")
        if missing:
            raise RuntimeError("Configuración insegura. Faltan: " + ", ".join(missing))


@lru_cache
def get_settings() -> Settings:
    return Settings()
