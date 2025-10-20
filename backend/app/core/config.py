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

    # Temporal Cloud
    TEMPORAL_HOST: str  # Format: <region>.<cloud_provider>.api.temporal.io:7233
    TEMPORAL_NAMESPACE: str  # Format: <namespace>.<account_id>
    TEMPORAL_API_KEY: str | None = None  # Temporal Cloud API Key (recommended)
    
    # Legacy mTLS (optional, only if not using API key)
    TEMPORAL_TLS_CERT: str | None = None  # Path to client cert
    TEMPORAL_TLS_KEY: str | None = None   # Path to client key

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
