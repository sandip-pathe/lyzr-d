from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import List
import os

class Settings(BaseSettings):
    # App
    APP_NAME: str = "Lyzr Orchestrator"
    DEBUG: bool = True
    API_PORT: int = 8000

    # CORS - Can be set via CORS_ORIGINS environment variable (comma-separated)
    # Use "*" to allow all origins (not recommended for production with credentials)
    CORS_ORIGINS: str = "http://localhost:3000,https://lyzr.anaya.legal"
    
    # Frontend URL (for notifications and approval links)
    FRONTEND_URL: str = "http://localhost:3000"
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS_ORIGINS string into a list"""
        origins_str = self.CORS_ORIGINS.strip()
        
        # If set to "*", return ["*"] for allow all
        if origins_str == "*":
            return ["*"]
        
        # Parse comma-separated list
        origins = [origin.strip() for origin in origins_str.split(",") if origin.strip()]
        
        # In production, also add common deployment URLs
        if not self.DEBUG:
            # Add the current Railway URL if available
            railway_url = os.getenv("RAILWAY_PUBLIC_DOMAIN")
            if railway_url:
                origins.append(f"https://{railway_url}")
        
        return origins

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
