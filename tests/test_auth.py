from tests.conftest import auth_header, register_user


def test_register(client):
    resp = register_user(client)
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
    register_user(client)
    resp = client.post(
        "/api/v1/auth/login",
        json={"phone": "0712345678", "password": "testpass123"},
    )
    assert resp.status_code == 200
    assert resp.json()["access_token"]


def test_login_wrong_password(client):
    register_user(client)
    resp = client.post(
        "/api/v1/auth/login",
        json={"phone": "0712345678", "password": "wrong"},
    )
    assert resp.status_code == 401


def test_get_me(client):
    token = register_user(client).json()["access_token"]
    resp = client.get("/api/v1/auth/me", headers=auth_header(token))
    assert resp.status_code == 200
    assert resp.json()["full_name"] == "Test User"


def test_update_me(client):
    token = register_user(client).json()["access_token"]
    resp = client.patch(
        "/api/v1/auth/me",
        headers=auth_header(token),
        json={"full_name": "Updated Name"},
    )
    assert resp.status_code == 200
    assert resp.json()["full_name"] == "Updated Name"


def test_request_verification(client):
    token = register_user(client).json()["access_token"]
    resp = client.post(
        "/api/v1/auth/verify",
        headers=auth_header(token),
        json={"national_id": "19900101-12345-00001-01"},
    )
    assert resp.status_code == 200
    assert resp.json()["verification_status"] == "pending"
