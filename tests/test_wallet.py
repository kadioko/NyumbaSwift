import asyncio
import hashlib
import hmac
import json

import httpx

from app.core.config import settings
from app.services import ntzs as ntzs_service
from tests.conftest import auth_header, register_user


def test_wallet_overview_returns_live_balance(client, mock_wallet_ntzs):
    token = register_user(
        client,
        phone="0712400001",
        name="Wallet User",
        email="wallet@example.com",
    ).json()["access_token"]

    resp = client.get("/api/v1/wallet/", headers=auth_header(token))

    assert resp.status_code == 200
    data = resp.json()
    assert data["balance_tzs"] == 500000
    assert data["wallet_address"].startswith("0x")


def test_mobile_money_deposit_starts_processing(client, mock_wallet_ntzs):
    token = register_user(
        client,
        phone="0712400002",
        name="Deposit User",
        email="deposit@example.com",
    ).json()["access_token"]

    resp = client.post(
        "/api/v1/wallet/deposit",
        headers=auth_header(token),
        json={
            "amount": 10000,
            "payment_method": "mobile_money",
            "phone": "0712400002",
        },
    )

    assert resp.status_code == 202
    data = resp.json()
    assert data["status"] == "processing"
    assert data["payment_method"] == "mobile_money"


def test_card_deposit_returns_checkout_url(client, mock_wallet_ntzs):
    token = register_user(
        client,
        phone="0712400003",
        name="Card User",
        email="card@example.com",
    ).json()["access_token"]

    resp = client.post(
        "/api/v1/wallet/deposit",
        headers=auth_header(token),
        json={
            "amount": 12000,
            "payment_method": "card",
            "redirect_url": "https://nyumbaswift.example/success",
            "cancel_url": "https://nyumbaswift.example/cancel",
        },
    )

    assert resp.status_code == 202
    data = resp.json()
    assert data["payment_method"] == "card"
    assert data["payment_url"] == "https://pay.example.test/checkout"


def test_send_money_creates_completed_transfer(client, mock_wallet_ntzs):
    sender_token = register_user(
        client,
        phone="0712400004",
        name="Sender User",
        email="sender@example.com",
    ).json()["access_token"]
    register_user(
        client,
        phone="0712400005",
        name="Recipient User",
        email="recipient@example.com",
    )

    resp = client.post(
        "/api/v1/wallet/send",
        headers=auth_header(sender_token),
        json={
            "recipient_phone": "0712400005",
            "amount": 5000,
            "note": "Utilities",
        },
    )

    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "completed"
    assert data["type"] == "transfer_out"


def test_withdraw_uses_live_balance(client, mock_wallet_ntzs):
    token = register_user(
        client,
        phone="0712400006",
        name="Withdraw User",
        email="withdraw@example.com",
    ).json()["access_token"]

    resp = client.post(
        "/api/v1/wallet/withdraw",
        headers=auth_header(token),
        json={
            "amount": 5000,
            "phone": "0712400006",
        },
    )

    assert resp.status_code == 202
    data = resp.json()
    assert data["status"] == "completed"
    assert data["type"] == "withdrawal"


def test_wallet_mobile_deposit_does_not_collect_to_treasury(monkeypatch):
    captured_payload = {}

    async def fake_ensure_user(**kwargs):
        return {"id": "ntzs-user-1"}

    class FakeAsyncClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

        async def post(self, url, json=None, headers=None):
            captured_payload["url"] = url
            captured_payload["json"] = json
            return httpx.Response(
                200,
                json={"id": "deposit-1", "status": "submitted", "amountTzs": json["amountTzs"]},
            )

    monkeypatch.setattr("app.services.ntzs.ensure_ntzs_user", fake_ensure_user)
    monkeypatch.setattr("app.services.ntzs.httpx.AsyncClient", FakeAsyncClient)

    result = asyncio.run(
        ntzs_service.create_wallet_deposit_mobile(
            user_id=1,
            amount=10000,
            phone="0712400002",
            full_name="Deposit User",
            email="deposit@example.com",
        )
    )

    assert result["id"] == "deposit-1"
    assert captured_payload["json"]["paymentMethod"] == "mobile_money"
    assert captured_payload["json"]["phoneNumber"] == "255712400002"
    assert "collectToTreasury" not in captured_payload["json"]


def test_confirm_deposit_reconciles_from_live_balance_when_status_lookup_fails(client, monkeypatch):
    live_balance = {"value": 0}

    async def fake_get_ntzs_user(*, user_id=None, external_id=None, email=None, full_name=None, phone=None):
        resolved_id = str(user_id or external_id or "1")
        return {
            "id": f"ntzs-{resolved_id}",
            "balanceTzs": live_balance["value"],
            "balanceUsdc": 0,
            "walletAddress": f"0x{resolved_id.zfill(40)[:40]}",
        }

    async def fake_mobile_deposit(**kwargs):
        return {
            "id": "dep-mobile-2",
            "status": "submitted",
            "amount": kwargs.get("amount"),
            "paymentMethod": "mobile_money",
            "instructions": "Check your phone for the payment prompt",
        }

    async def fake_get_payment_status(reference):
        raise ntzs_service.NTZSError("nTZS did not return a deposit status. Wait for webhook confirmation or retry shortly.")

    monkeypatch.setattr("app.api.wallet.ntzs_service.get_ntzs_user", fake_get_ntzs_user)
    monkeypatch.setattr("app.api.wallet.ntzs_service.create_wallet_deposit_mobile", fake_mobile_deposit)
    monkeypatch.setattr("app.api.wallet.ntzs_service.get_payment_status", fake_get_payment_status)

    token = register_user(
        client,
        phone="0712400007",
        name="Recon User",
        email="recon@example.com",
    ).json()["access_token"]

    deposit_resp = client.post(
        "/api/v1/wallet/deposit",
        headers=auth_header(token),
        json={
            "amount": 10000,
            "payment_method": "mobile_money",
            "phone": "0712400007",
        },
    )
    assert deposit_resp.status_code == 202
    deposit_id = deposit_resp.json()["id"]

    live_balance["value"] = 10000
    confirm_resp = client.post(
        f"/api/v1/wallet/deposit/{deposit_id}/confirm",
        headers=auth_header(token),
        json={"ntzs_reference": "dep-mobile-2"},
    )

    assert confirm_resp.status_code == 200
    data = confirm_resp.json()
    assert data["status"] == "completed"

    wallet_resp = client.get("/api/v1/wallet/", headers=auth_header(token))
    assert wallet_resp.status_code == 200
    assert wallet_resp.json()["balance_tzs"] == 10000


def test_reconciliation_prefers_exact_recent_deposit_match(client, monkeypatch):
    live_balance = {"value": 0}

    async def fake_get_ntzs_user(*, user_id=None, external_id=None, email=None, full_name=None, phone=None):
        resolved_id = str(user_id or external_id or "1")
        return {
            "id": f"ntzs-{resolved_id}",
            "balanceTzs": live_balance["value"],
            "balanceUsdc": 0,
            "walletAddress": f"0x{resolved_id.zfill(40)[:40]}",
        }

    created_refs = iter(["dep-older-1500", "dep-newer-1600"])

    async def fake_mobile_deposit(**kwargs):
        return {
            "id": next(created_refs),
            "status": "submitted",
            "amount": kwargs.get("amount"),
            "paymentMethod": "mobile_money",
            "instructions": "Check your phone for the payment prompt",
        }

    async def fake_get_payment_status(reference):
        raise ntzs_service.NTZSError("status lookup unavailable")

    monkeypatch.setattr("app.api.wallet.ntzs_service.get_ntzs_user", fake_get_ntzs_user)
    monkeypatch.setattr("app.api.wallet.ntzs_service.create_wallet_deposit_mobile", fake_mobile_deposit)
    monkeypatch.setattr("app.api.wallet.ntzs_service.get_payment_status", fake_get_payment_status)

    token = register_user(
        client,
        phone="0712400009",
        name="Matcher User",
        email="matcher@example.com",
    ).json()["access_token"]

    first = client.post(
        "/api/v1/wallet/deposit",
        headers=auth_header(token),
        json={
            "amount": 1500,
            "payment_method": "mobile_money",
            "phone": "0712400009",
        },
    )
    second = client.post(
        "/api/v1/wallet/deposit",
        headers=auth_header(token),
        json={
            "amount": 1600,
            "payment_method": "mobile_money",
            "phone": "0712400009",
        },
    )
    assert first.status_code == 202
    assert second.status_code == 202

    live_balance["value"] = 1600
    wallet_resp = client.get("/api/v1/wallet/", headers=auth_header(token))
    assert wallet_resp.status_code == 200
    assert wallet_resp.json()["balance_tzs"] == 1600

    txns_resp = client.get("/api/v1/wallet/transactions", headers=auth_header(token))
    assert txns_resp.status_code == 200
    txns = txns_resp.json()
    by_amount = {txn["amount"]: txn for txn in txns}
    assert by_amount[1600]["status"] == "completed"
    assert by_amount[1500]["status"] == "processing"


def test_shared_ntzs_webhook_completes_wallet_deposit(client, mock_wallet_ntzs, monkeypatch):
    monkeypatch.setattr(settings, "NTZS_WEBHOOK_SECRET", "test-secret")

    token = register_user(
        client,
        phone="0712400008",
        name="Webhook User",
        email="webhook@example.com",
    ).json()["access_token"]

    deposit_resp = client.post(
        "/api/v1/wallet/deposit",
        headers=auth_header(token),
        json={
            "amount": 10000,
            "payment_method": "mobile_money",
            "phone": "0712400008",
        },
    )
    assert deposit_resp.status_code == 202

    event = {
        "type": "deposit.completed",
        "data": {
            "depositId": "dep-mobile-1",
            "amountTzs": 10000,
        },
    }
    payload = json.dumps(event).encode()
    signature = hmac.new(settings.NTZS_WEBHOOK_SECRET.encode(), payload, hashlib.sha256).hexdigest()

    webhook_resp = client.post(
        "/api/v1/ntzs/webhooks",
        data=payload,
        headers={"x-ntzs-signature": signature, "Content-Type": "application/json"},
    )
    assert webhook_resp.status_code == 200
    assert webhook_resp.json()["status"] == "ok"

    transactions_resp = client.get("/api/v1/wallet/transactions", headers=auth_header(token))
    assert transactions_resp.status_code == 200
    assert transactions_resp.json()[0]["status"] == "completed"
