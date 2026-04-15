from tests.conftest import auth_header, register_user


SAMPLE_PROPERTY = {
    "title": "2BR Apartment in Kinondoni",
    "description": "Modern apartment with water and electricity",
    "property_type": "apartment",
    "district": "Kinondoni",
    "ward": "Msasani",
    "street": "Old Bagamoyo Road",
    "bedrooms": 2,
    "bathrooms": 1,
    "rent_amount": 500000,
    "deposit_amount": 500000,
    "furnished": True,
}


def create_landlord(client, phone="0712000001"):
    resp = register_user(client, phone=phone, name="Landlord", role="landlord", email=f"{phone}@example.com")
    return resp.json()["access_token"]


def create_admin(client, phone="0712000099"):
    resp = register_user(client, phone=phone, name="Admin", role="admin", email=f"{phone}@example.com")
    return resp.json()["access_token"]


def test_create_property(client):
    token = create_landlord(client)
    resp = client.post(
        "/api/v1/properties/",
        headers=auth_header(token),
        json=SAMPLE_PROPERTY,
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["title"] == "2BR Apartment in Kinondoni"
    assert data["status"] == "pending_verification"
    assert data["rent_amount"] == 500000


def test_renter_cannot_create_property(client):
    token = register_user(client).json()["access_token"]
    resp = client.post(
        "/api/v1/properties/",
        headers=auth_header(token),
        json=SAMPLE_PROPERTY,
    )
    assert resp.status_code == 403


def test_list_properties_empty(client):
    resp = client.get("/api/v1/properties/")
    assert resp.status_code == 200
    assert resp.json()["total"] == 0


def test_search_properties_by_district(client):
    # Create and verify a property
    token = create_landlord(client)
    create_resp = client.post(
        "/api/v1/properties/",
        headers=auth_header(token),
        json=SAMPLE_PROPERTY,
    )
    prop_id = create_resp.json()["id"]

    admin_token = create_admin(client)
    client.post(
        f"/api/v1/properties/{prop_id}/verify",
        headers=auth_header(admin_token),
    )

    # Search
    resp = client.get("/api/v1/properties/?district=Kinondoni")
    assert resp.status_code == 200
    assert resp.json()["total"] == 1


def test_update_property(client):
    token = create_landlord(client)
    create_resp = client.post(
        "/api/v1/properties/",
        headers=auth_header(token),
        json=SAMPLE_PROPERTY,
    )
    prop_id = create_resp.json()["id"]

    admin_token = create_admin(client, phone="0712000100")
    verify_resp = client.post(
        f"/api/v1/properties/{prop_id}/verify",
        headers=auth_header(admin_token),
    )
    assert verify_resp.status_code == 200

    resp = client.patch(
        f"/api/v1/properties/{prop_id}",
        headers=auth_header(token),
        json={"rent_amount": 600000},
    )
    assert resp.status_code == 200
    assert resp.json()["rent_amount"] == 600000
    assert resp.json()["status"] == "pending_verification"
    assert resp.json()["is_verified"] is False


def test_cannot_activate_unverified_property(client):
    token = create_landlord(client, phone="0712000008")
    create_resp = client.post(
        "/api/v1/properties/",
        headers=auth_header(token),
        json=SAMPLE_PROPERTY,
    )
    prop_id = create_resp.json()["id"]

    resp = client.patch(
        f"/api/v1/properties/{prop_id}",
        headers=auth_header(token),
        json={"status": "active"},
    )
    assert resp.status_code == 400


def test_boost_property(client):
    token = create_landlord(client)
    create_resp = client.post(
        "/api/v1/properties/",
        headers=auth_header(token),
        json=SAMPLE_PROPERTY,
    )
    prop_id = create_resp.json()["id"]

    admin_token = create_admin(client, phone="0712000101")
    verify_resp = client.post(
        f"/api/v1/properties/{prop_id}/verify",
        headers=auth_header(admin_token),
    )
    assert verify_resp.status_code == 200

    resp = client.post(
        f"/api/v1/properties/{prop_id}/boost",
        headers=auth_header(token),
    )
    assert resp.status_code == 200
    assert resp.json()["is_premium"] is True


def test_cannot_boost_unverified_property(client):
    token = create_landlord(client, phone="0712000010")
    create_resp = client.post(
        "/api/v1/properties/",
        headers=auth_header(token),
        json=SAMPLE_PROPERTY,
    )
    prop_id = create_resp.json()["id"]

    resp = client.post(
        f"/api/v1/properties/{prop_id}/boost",
        headers=auth_header(token),
    )
    assert resp.status_code == 400
