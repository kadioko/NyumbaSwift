from pydantic import model_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "NyumbaSwift"
    VERSION: str = "0.1.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = "sqlite:///./nyumbaswift.db"
    AUTO_CREATE_TABLES: bool = True
    CORS_ORIGINS: str = ""
    ALLOWED_HOSTS: str = "*"

    # JWT Auth
    SECRET_KEY: str = "nyumbaswift-dev-secret-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    BCRYPT_ROUNDS: int = 12

    # Rent collection fee
    RENT_COLLECTION_FEE_PERCENT: float = 1.5

    # Renter unlock fee (TZS)
    RENTER_UNLOCK_FEE_TZS: int = 5000

    # Premium listing fee (TZS/month)
    PREMIUM_LISTING_FEE_TZS: int = 20000

    # M-Pesa config
    MPESA_API_KEY: str = ""
    MPESA_PUBLIC_KEY: str = ""
    MPESA_SERVICE_PROVIDER_CODE: str = ""

    # nTZS partner API config
    NTZS_BASE_URL: str = "https://www.ntzs.co.tz"
    NTZS_API_KEY: str = ""
    NTZS_WEBHOOK_SECRET: str = ""
    PUBLIC_BASE_URL: str = "https://nyumbaswift.vercel.app"

    @model_validator(mode="after")
    def validate_production_settings(self):
        is_production = self.ENVIRONMENT.lower() in {"prod", "production"}
        if not is_production:
            return self

        if self.SECRET_KEY == "nyumbaswift-dev-secret-change-in-production":
            raise ValueError("SECRET_KEY must be changed when ENVIRONMENT=production")
        if self.DATABASE_URL.startswith("sqlite"):
            raise ValueError("DATABASE_URL must not use SQLite when ENVIRONMENT=production")
        if self.DEBUG:
            raise ValueError("DEBUG must be false when ENVIRONMENT=production")
        if self.BCRYPT_ROUNDS < 12:
            raise ValueError("BCRYPT_ROUNDS must be at least 12 when ENVIRONMENT=production")
        if self.allowed_hosts_list == ["*"]:
            raise ValueError("ALLOWED_HOSTS must be explicit when ENVIRONMENT=production")

        return self

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def allowed_hosts_list(self) -> list[str]:
        return [host.strip() for host in self.ALLOWED_HOSTS.split(",") if host.strip()]

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


settings = Settings()
