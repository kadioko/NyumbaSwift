import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.main import app

SQLALCHEMY_DATABASE_URL = "sqlite://"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture
def db():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def mock_snippe_processing(monkeypatch):
    async def fake_create_mobile_payment(**kwargs):
        reference = kwargs.get("reference", "payment-ref")
        return {
            "status": "processing",
            "reference": reference,
            "external_reference": reference.upper(),
        }

    async def fake_get_payment_status(reference):
        return {
            "status": "completed",
            "reference": reference,
            "external_reference": reference,
        }

    monkeypatch.setattr("app.api.rentals.create_mobile_payment", fake_create_mobile_payment)
    monkeypatch.setattr("app.api.rentals.get_payment_status", fake_get_payment_status)


@pytest.fixture
def mock_snippe_failed_lookup(monkeypatch):
    async def fake_create_mobile_payment(**kwargs):
        reference = kwargs.get("reference", "payment-ref")
        return {
            "status": "processing",
            "reference": reference,
            "external_reference": reference.upper(),
        }

    async def fake_get_payment_status(reference):
        return {
            "status": "failed",
            "reference": reference,
            "external_reference": reference,
        }

    monkeypatch.setattr("app.api.rentals.create_mobile_payment", fake_create_mobile_payment)
    monkeypatch.setattr("app.api.rentals.get_payment_status", fake_get_payment_status)


def register_user(client, phone="0712345678", name="Test User", role="renter", email=None):
    return client.post(
        "/api/v1/auth/register",
        json={
            "phone": phone,
            "full_name": name,
            "password": "testpass123",
            "email": email,
            "role": role,
        },
    )


def auth_header(token):
    return {"Authorization": f"Bearer {token}"}
