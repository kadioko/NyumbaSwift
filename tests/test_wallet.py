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
