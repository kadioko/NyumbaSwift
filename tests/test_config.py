import pytest
from pydantic import ValidationError

from app.core.config import Settings


def test_development_settings_allow_dev_defaults():
    settings = Settings(_env_file=None)

    assert settings.ENVIRONMENT == "development"
    assert settings.AUTO_CREATE_TABLES is True
    assert settings.cors_origins_list == []


def test_cors_origins_are_parsed_from_comma_separated_config():
    settings = Settings(
        CORS_ORIGINS="http://localhost:5173, https://nyumbaswift.vercel.app ,,",
        _env_file=None,
    )

    assert settings.cors_origins_list == [
        "http://localhost:5173",
        "https://nyumbaswift.vercel.app",
    ]


def test_production_settings_reject_dev_secret():
    with pytest.raises(ValidationError, match="SECRET_KEY must be changed"):
        Settings(
            ENVIRONMENT="production",
            DEBUG=False,
            DATABASE_URL="postgresql://user:pass@localhost:5432/nyumbaswift",
            _env_file=None,
        )


def test_production_settings_reject_sqlite():
    with pytest.raises(ValidationError, match="DATABASE_URL must not use SQLite"):
        Settings(
            ENVIRONMENT="production",
            DEBUG=False,
            SECRET_KEY="production-secret",
            DATABASE_URL="sqlite:///./nyumbaswift.db",
            _env_file=None,
        )


def test_production_settings_reject_debug():
    with pytest.raises(ValidationError, match="DEBUG must be false"):
        Settings(
            ENVIRONMENT="production",
            DEBUG=True,
            SECRET_KEY="production-secret",
            DATABASE_URL="postgresql://user:pass@localhost:5432/nyumbaswift",
            _env_file=None,
        )


def test_production_settings_reject_weak_bcrypt_rounds():
    with pytest.raises(ValidationError, match="BCRYPT_ROUNDS must be at least 12"):
        Settings(
            ENVIRONMENT="production",
            DEBUG=False,
            SECRET_KEY="production-secret",
            DATABASE_URL="postgresql://user:pass@localhost:5432/nyumbaswift",
            BCRYPT_ROUNDS=4,
            _env_file=None,
        )


def test_production_settings_reject_wildcard_allowed_hosts():
    with pytest.raises(ValidationError, match="ALLOWED_HOSTS must be explicit"):
        Settings(
            ENVIRONMENT="production",
            DEBUG=False,
            SECRET_KEY="production-secret",
            DATABASE_URL="postgresql://user:pass@localhost:5432/nyumbaswift",
            BCRYPT_ROUNDS=12,
            ALLOWED_HOSTS="*",
            _env_file=None,
        )


def test_allowed_hosts_are_parsed_from_comma_separated_config():
    settings = Settings(
        ALLOWED_HOSTS="nyumbaswift.example.com, api.nyumbaswift.example.com ,,",
        _env_file=None,
    )

    assert settings.allowed_hosts_list == [
        "nyumbaswift.example.com",
        "api.nyumbaswift.example.com",
    ]
