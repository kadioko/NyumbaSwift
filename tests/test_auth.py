from tests.conftest import auth_header, register_user


def test_register(client):
    resp = register_user(client, email="test@example.com")
    assert resp.status_code == 201
    data = resp.json()
    assert data["access_token"]
    assert data["user"]["phone"] == "0712345678"
    assert data["user"]["role"] == "renter"


def test_register_duplicate_phone(client):
    register_user(client)
    resp = register_user(client)
    assert resp.status_code == 400


def test_login(client):
    register_user(client, email="test@example.com")
    resp = client.post(
        "/api/v1/auth/login",
        json={"phone": "0712345678", "password": "testpass123"},
    )
    assert resp.status_code == 200
    assert resp.json()["access_token"]


def test_login_wrong_password(client):
    register_user(client, email="test@example.com")
    resp = client.post(
        "/api/v1/auth/login",
        json={"phone": "0712345678", "password": "wrong"},
    )
    assert resp.status_code == 401


def test_get_me(client):
    token = register_user(client, email="test@example.com").json()["access_token"]
    resp = client.get("/api/v1/auth/me", headers=auth_header(token))
    assert resp.status_code == 200
    assert resp.json()["full_name"] == "Test User"


def test_update_me(client):
    token = register_user(client, email="test@example.com").json()["access_token"]
    resp = client.patch(
        "/api/v1/auth/me",
        headers=auth_header(token),
        json={"full_name": "Updated Name"},
    )
    assert resp.status_code == 200
    assert resp.json()["full_name"] == "Updated Name"


def test_request_verification(client):
    token = register_user(client, email="verify@example.com").json()["access_token"]
    resp = client.post(
        "/api/v1/auth/verify",
        headers=auth_header(token),
        json={
            "national_id": "19900101-12345-00001-01",
            "profile_photo_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9sX0X2sAAAAASUVORK5CYII=",
        },
    )
    assert resp.status_code == 200
    assert resp.json()["verification_status"] == "pending"


def test_request_verification_requires_email(client):
    token = register_user(client).json()["access_token"]
    resp = client.post(
        "/api/v1/auth/verify",
        headers=auth_header(token),
        json={"national_id": "19900101-12345-00001-01"},
    )
    assert resp.status_code == 400


def test_request_verification_rejects_invalid_image_payload(client):
    token = register_user(client, phone="0712345600", email="verify2@example.com").json()["access_token"]
    resp = client.post(
        "/api/v1/auth/verify",
        headers=auth_header(token),
        json={
            "national_id": "19900101-12345-00001-01",
            "profile_photo_url": "https://example.com/id.png",
        },
    )
    assert resp.status_code == 422


def test_login_rate_limit(client):
    register_user(client, phone="0712345611", email="ratelimit@example.com")
    for _ in range(8):
        resp = client.post(
            "/api/v1/auth/login",
            json={"phone": "0712345611", "password": "wrong"},
        )
        assert resp.status_code == 401

    blocked = client.post(
        "/api/v1/auth/login",
        json={"phone": "0712345611", "password": "wrong"},
    )
    assert blocked.status_code == 429
