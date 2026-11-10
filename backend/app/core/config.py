"""Application configuration management using Pydantic Settings."""

import json
from pathlib import Path
from typing import Annotated, Any, List, Union
from pydantic import BeforeValidator, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Resolve BACKEND root so .env is always found regardless of working directory
_BACKEND_ROOT = Path(__file__).resolve().parent.parent.parent


def parse_cors_origins(v: Any) -> List[str]:
    """Parse CORS origins from a list, a JSON string, or a comma-separated string."""
    if isinstance(v, list):
        return [str(item) for item in v]
    if isinstance(v, str):
        v = v.strip()
        if v.startswith("[") and v.endswith("]"):
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    return [str(item) for item in parsed]
            except Exception:
                pass
        return [item.strip() for item in v.split(",") if item.strip()]
    return ["http://localhost:3000", "http://127.0.0.1:3000"]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(_BACKEND_ROOT / ".env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    ENVIRONMENT: str = "development"
    PROJECT_NAME: str = "SENTRA — State-wise Environmental, Natural-disaster, Health-impact and Resource Optimization Platform"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = False

    @field_validator("DEBUG", mode="before")
    @classmethod
    def parse_debug_bool(cls, v: Any) -> bool:
        if isinstance(v, bool):
            return v
        if isinstance(v, str):
            return v.strip().lower() in ("true", "1", "yes", "debug", "dev", "development")
        return bool(v)

    # Database
    DATABASE_URL: str = "postgresql+psycopg://sentra_user:sentra_password@localhost:5432/sentra_db"

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: str) -> str:
        if isinstance(v, str):
            # Normalize postgresql:// to postgresql+psycopg:// for psycopg3
            if v.startswith("postgresql://"):
                return v.replace("postgresql://", "postgresql+psycopg://", 1)
            if v.startswith("postgres://"):
                return v.replace("postgres://", "postgresql+psycopg://", 1)
        return v

    # Security & JWT
    JWT_SECRET_KEY: str = "change_this_to_a_very_strong_random_secret_in_production_environment_32bytes_min"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    JWT_ISSUER: str = "sentra-backend"
    JWT_AUDIENCE: str = "sentra-platform"

    # CORS
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]

    @field_validator("CORS_ORIGINS", mode="after")
    @classmethod
    def validate_cors(cls, v: Any) -> List[str]:
        return parse_cors_origins(v)

    # Logging
    LOG_LEVEL: str = "INFO"

    # Rate Limiting
    LOGIN_RATE_LIMIT_PER_MINUTE: int = 10
    OPTIMIZATION_RATE_LIMIT_PER_MINUTE: int = 30

    # Initial Bootstrap Superuser
    FIRST_SUPERUSER_EMAIL: str = "admin@sentra.gov.in"
    FIRST_SUPERUSER_PASSWORD: str = "AdminSecurePassword123!"
    FIRST_SUPERUSER_NAME: str = "National Disaster Administrator"


settings = Settings()
