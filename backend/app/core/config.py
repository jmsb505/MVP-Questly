from functools import lru_cache
from os import getenv

from dotenv import load_dotenv
from pydantic import BaseModel

load_dotenv(override=True)


class Settings(BaseModel):
    app_env: str = "development"
    service_name: str = "hightech-api"
    cors_origins: list[str] = [
        "http://localhost:5280",
        "http://127.0.0.1:5280",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]
    cors_origin_regex: str | None = r"^http://(localhost|127\.0\.0\.1):\d+$"
    supabase_url: str | None = None
    supabase_publishable_key: str | None = None
    supabase_secret_key: str | None = None
    openai_api_key: str | None = None
    openai_reward_model: str = "gpt-5.4-nano"
    sentry_dsn: str | None = None
    sentry_traces_sample_rate: float = 0.0


def _split_csv(value: str | None, default: list[str]) -> list[str]:
    if not value:
        return default
    return [item.strip() for item in value.split(",") if item.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings(
        app_env=getenv("APP_ENV", "development"),
        service_name=getenv("API_SERVICE_NAME", "hightech-api"),
        cors_origins=_split_csv(
            getenv("API_CORS_ORIGINS"),
            [
                "http://localhost:5280",
                "http://127.0.0.1:5280",
                "http://localhost:5173",
                "http://127.0.0.1:5173",
            ],
        ),
        cors_origin_regex=getenv(
            "API_CORS_ORIGIN_REGEX",
            r"^http://(localhost|127\.0\.0\.1):\d+$",
        ),
        supabase_url=getenv("SUPABASE_URL"),
        supabase_publishable_key=getenv("SUPABASE_PUBLISHABLE_KEY")
        or getenv("VITE_SUPABASE_PUBLISHABLE_KEY"),
        supabase_secret_key=getenv("SUPABASE_SECRET_KEY") or getenv("SUPABASE_PRIVATE_KEY"),
        openai_api_key=getenv("OPENAI_API_KEY"),
        openai_reward_model=getenv("OPENAI_REWARD_MODEL", "gpt-5.4-nano"),
        sentry_dsn=getenv("SENTRY_DSN"),
        sentry_traces_sample_rate=float(getenv("SENTRY_TRACES_SAMPLE_RATE", "0")),
    )
