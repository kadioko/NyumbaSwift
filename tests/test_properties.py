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
    resp = register_user(client, phone=phone, name="Landlord", role="landlord")
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

    # Register an admin to verify
    admin_resp = register_user(client, phone="0712000099", name="Admin", role="admin")
    admin_token = admin_resp.json()["access_token"]

    # Need to set role to admin in DB (register defaults come through API)
    # For test, we'll use the admin endpoint which checks role
    # Since our register allows setting role, the admin token should work
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

    resp = client.patch(
        f"/api/v1/properties/{prop_id}",
        headers=auth_header(token),
        json={"rent_amount": 600000},
    )
    assert resp.status_code == 200
    assert resp.json()["rent_amount"] == 600000


def test_boost_property(client):
    token = create_landlord(client)
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
    assert resp.status_code == 200
    assert resp.json()["is_premium"] is True
