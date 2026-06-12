from fastapi.testclient import TestClient
from sqlalchemy.exc import OperationalError

from app.core.config import Settings
from app.main import create_app


def test_health_returns_safe_runtime_metadata(client):
    resp = client.get("/health")

    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "healthy"
    assert data["app"] == "NyumbaSwift"
    assert data["environment"]
    assert "SECRET_KEY" not in data
    assert "DATABASE_URL" not in data


def test_ready_returns_database_status(client):
    resp = client.get("/ready")

    assert resp.status_code == 200
    assert resp.json() == {"status": "ready", "database": "available"}


def test_ready_reports_unavailable_database(monkeypatch):
    class BrokenSession:
        def __enter__(self):
            raise OperationalError("SELECT 1", {}, Exception("database unavailable"))

        def __exit__(self, exc_type, exc, traceback):
            return False

    monkeypatch.setattr("app.main.SessionLocal", lambda: BrokenSession())
    test_app = create_app(Settings(AUTO_CREATE_TABLES=False, _env_file=None))

    with TestClient(test_app) as client:
        resp = client.get("/ready")

    assert resp.status_code == 200
    assert resp.json() == {"status": "unready", "database": "unavailable"}


def test_create_app_uses_injected_runtime_settings():
    test_app = create_app(
        Settings(
            ENVIRONMENT="test",
            DEBUG=False,
            AUTO_CREATE_TABLES=False,
            _env_file=None,
        )
    )

    with TestClient(test_app) as client:
        resp = client.get("/health")

    assert resp.status_code == 200
    data = resp.json()
    assert data["environment"] == "test"
    assert data["debug"] is False
    assert data["auto_create_tables"] is False


def test_create_app_applies_configured_cors_origins():
    test_app = create_app(
        Settings(
            CORS_ORIGINS="http://localhost:5173",
            AUTO_CREATE_TABLES=False,
            _env_file=None,
        )
    )

    with TestClient(test_app) as client:
        resp = client.options(
            "/api/v1/auth/me",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "GET",
            },
        )

    assert resp.status_code == 200
    assert resp.headers["access-control-allow-origin"] == "http://localhost:5173"


def test_security_headers_are_applied_to_responses():
    test_app = create_app(Settings(AUTO_CREATE_TABLES=False, _env_file=None))

    with TestClient(test_app) as client:
        resp = client.get("/health")

    assert resp.status_code == 200
    assert resp.headers["x-content-type-options"] == "nosniff"
    assert resp.headers["x-frame-options"] == "DENY"
    assert resp.headers["referrer-policy"] == "strict-origin-when-cross-origin"
    assert resp.headers["permissions-policy"] == "camera=(), microphone=(), geolocation=()"


def test_production_responses_include_hsts():
    test_app = create_app(
        Settings(
            ENVIRONMENT="production",
            DEBUG=False,
            SECRET_KEY="production-secret",
            DATABASE_URL="postgresql://user:pass@localhost:5432/nyumbaswift",
            BCRYPT_ROUNDS=12,
            ALLOWED_HOSTS="testserver",
            AUTO_CREATE_TABLES=False,
            _env_file=None,
        )
    )

    with TestClient(test_app) as client:
        resp = client.get("/health")

    assert resp.status_code == 200
    assert resp.headers["strict-transport-security"] == "max-age=31536000; includeSubDomains"


def test_trusted_host_middleware_rejects_unconfigured_hosts():
    test_app = create_app(
        Settings(
            ALLOWED_HOSTS="nyumbaswift.example.com",
            AUTO_CREATE_TABLES=False,
            _env_file=None,
        )
    )

    with TestClient(test_app, base_url="http://unknown.example.com") as client:
        resp = client.get("/health")

    assert resp.status_code == 400
