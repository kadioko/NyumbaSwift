import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.rate_limit import _attempts
from app.core.database import Base, get_db
from app.main import app

SQLALCHEMY_DATABASE_URL = "sqlite://"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(autouse=True)
def reset_rate_limits():
    _attempts.clear()
    yield
    _attempts.clear()


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


@pytest.fixture
def mock_wallet_ntzs(monkeypatch):
    async def fake_get_ntzs_user(*, user_id=None, external_id=None, email=None, full_name=None, phone=None):
        resolved_id = str(user_id or external_id or "1")
        return {
            "id": f"ntzs-{resolved_id}",
            "balanceTzs": 500000,
            "balanceUsdc": 0,
            "walletAddress": f"0x{resolved_id.zfill(40)[:40]}",
        }

    async def fake_mobile_deposit(**kwargs):
        return {
            "id": "dep-mobile-1",
            "status": "submitted",
            "amount": kwargs.get("amount"),
            "paymentMethod": "mobile_money",
            "instructions": "Check your phone for the payment prompt",
        }

    async def fake_card_deposit(**kwargs):
        return {
            "id": "dep-card-1",
            "status": "submitted",
            "amount": kwargs.get("amount"),
            "paymentMethod": "card",
            "paymentUrl": "https://pay.example.test/checkout",
        }

    async def fake_withdrawal(**kwargs):
        return {
            "id": "wd-1",
            "status": "burned",
            "amount": kwargs.get("amount"),
            "message": "Withdrawal processed successfully.",
        }

    async def fake_payment_status(reference):
        return {
            "id": reference,
            "status": "completed",
        }

    async def fake_withdrawal_status(reference):
        return {
            "id": reference,
            "status": "burned",
        }

    async def fake_transfer(**kwargs):
        return {
            "id": "transfer-1",
            "status": "completed",
            "txHash": "0xtransfer",
            "amountTzs": kwargs.get("amount"),
            "recipientAmountTzs": kwargs.get("amount"),
            "feeAmountTzs": 0,
        }

    monkeypatch.setattr("app.api.wallet.ntzs_service.get_ntzs_user", fake_get_ntzs_user)
    monkeypatch.setattr("app.api.wallet.ntzs_service.create_wallet_deposit_mobile", fake_mobile_deposit)
    monkeypatch.setattr("app.api.wallet.ntzs_service.create_wallet_deposit_card", fake_card_deposit)
    monkeypatch.setattr("app.api.wallet.ntzs_service.create_withdrawal", fake_withdrawal)
    monkeypatch.setattr("app.api.wallet.ntzs_service.get_payment_status", fake_payment_status)
    monkeypatch.setattr("app.api.wallet.ntzs_service.get_withdrawal_status", fake_withdrawal_status)
    monkeypatch.setattr("app.api.wallet.ntzs_service.create_transfer", fake_transfer)
    monkeypatch.setattr("app.api.rentals.get_ntzs_user", fake_get_ntzs_user)
    monkeypatch.setattr("app.api.rentals.create_transfer", fake_transfer)


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
