from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env")

    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/kubera"
    redis_url: str | None = None

    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""
    stripe_publishable_key: str = ""

    nextauth_secret: str = ""
    nextauth_url: str = "http://localhost:3000"

    cors_origins: str = "http://localhost:3000"
    environment: str = "development"
    log_level: str = "INFO"
    sentry_dsn: str | None = None
    open_exchange_rates_key: str | None = None

    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_user: str | None = None
    smtp_pass: str | None = None

    api_v1_prefix: str = "/api/v1"
    project_name: str = "KUBERA API"
    version: str = "1.0.0"

    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
