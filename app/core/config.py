from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "NyumbaSwift"
    VERSION: str = "0.1.0"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = "sqlite:///./nyumbaswift.db"

    # JWT Auth
    SECRET_KEY: str = "nyumbaswift-dev-secret-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

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

    model_config = {"env_file": ".env"}


settings = Settings()
