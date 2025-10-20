from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import List

class Settings(BaseSettings):
    # App
    APP_NAME: str = "Lyzr Orchestrator"
    DEBUG: bool = True
    API_PORT: int = 8000

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]

    # Database
    DATABASE_URL: str

    # Redis
    REDIS_URL: str

    # Temporal
    TEMPORAL_HOST: str
    TEMPORAL_NAMESPACE: str = "default"
    TEMPORAL_TLS_CERT: str | None = None  # Path to client cert for Temporal Cloud
    TEMPORAL_TLS_KEY: str | None = None   # Path to client key for Temporal Cloud
    TEMPORAL_TLS_CERT_BASE64: str | None = None  # Alternative: base64-encoded cert
    TEMPORAL_TLS_KEY_BASE64: str | None = None   # Alternative: base64-encoded key

    # APIs
    OPENAI_API_KEY: str
    LYZR_API_KEY: str | None = None

    # Notifications
    SLACK_WEBHOOK_URL: str | None = None
    RESEND_API_KEY: str | None = None
    FROM_EMAIL: str | None = None

    class Config:
        env_file = ".env"

@lru_cache()
def get_settings():
    return Settings() # type: ignore # Will load from .env automatically

settings = get_settings()
