from tests.conftest import auth_header, register_user


SAMPLE_PROPERTY = {
    "title": "Studio in Ilala",
    "description": "Cozy studio near the market",
    "property_type": "studio",
    "district": "Ilala",
    "ward": "Kariakoo",
    "street": "Uhuru Street",
    "bedrooms": 1,
    "bathrooms": 1,
    "rent_amount": 300000,
}


def setup_rental(client):
    """Create landlord, tenant, property, and rental."""
    # Landlord
    landlord_resp = register_user(
        client, phone="0712100001", name="Landlord", role="landlord"
    )
    landlord_token = landlord_resp.json()["access_token"]

    # Tenant
    tenant_resp = register_user(
        client, phone="0712100002", name="Tenant", role="renter"
    )
    tenant_token = tenant_resp.json()["access_token"]
    tenant_id = tenant_resp.json()["user"]["id"]

    # Property
    prop_resp = client.post(
        "/api/v1/properties/",
        headers=auth_header(landlord_token),
        json=SAMPLE_PROPERTY,
    )
    prop_id = prop_resp.json()["id"]

    # Rental
    rental_resp = client.post(
        "/api/v1/rentals/",
        headers=auth_header(landlord_token),
        json={
            "property_id": prop_id,
            "tenant_id": tenant_id,
            "monthly_rent": 300000,
            "start_date": "2026-03-01T00:00:00Z",
        },
    )
    rental_id = rental_resp.json()["id"]

    return landlord_token, tenant_token, prop_id, rental_id


def test_create_rental(client):
    landlord_token, tenant_token, prop_id, rental_id = setup_rental(client)
    assert rental_id is not None


def test_initiate_rent_payment(client):
    landlord_token, tenant_token, prop_id, rental_id = setup_rental(client)

    resp = client.post(
        "/api/v1/rentals/payments",
        headers=auth_header(tenant_token),
        json={"rental_id": rental_id, "payment_month": "2026-03"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["amount"] == 300000
    assert data["platform_fee"] == 4500  # 1.5% of 300,000
    assert data["landlord_payout"] == 295500
    assert data["status"] == "pending"


def test_confirm_payment(client):
    landlord_token, tenant_token, prop_id, rental_id = setup_rental(client)

    # Initiate payment
    pay_resp = client.post(
        "/api/v1/rentals/payments",
        headers=auth_header(tenant_token),
        json={"rental_id": rental_id, "payment_month": "2026-03"},
    )
    payment_id = pay_resp.json()["id"]

    # Confirm
    resp = client.post(
        f"/api/v1/rentals/payments/{payment_id}/confirm?mpesa_reference=MPESA123ABC",
        headers=auth_header(tenant_token),
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "completed"
    assert resp.json()["mpesa_reference"] == "MPESA123ABC"


def test_duplicate_payment_blocked(client):
    landlord_token, tenant_token, prop_id, rental_id = setup_rental(client)

    # First payment
    client.post(
        "/api/v1/rentals/payments",
        headers=auth_header(tenant_token),
        json={"rental_id": rental_id, "payment_month": "2026-03"},
    )

    # Duplicate
    resp = client.post(
        "/api/v1/rentals/payments",
        headers=auth_header(tenant_token),
        json={"rental_id": rental_id, "payment_month": "2026-03"},
    )
    # Pending payment blocks duplicate
    assert resp.status_code == 400


def test_unlock_listing(client):
    landlord_token, tenant_token, prop_id, rental_id = setup_rental(client)

    # Tenant unlocks property contact
    renter_resp = register_user(
        client, phone="0712100003", name="Renter", role="renter"
    )
    renter_token = renter_resp.json()["access_token"]

    resp = client.post(
        "/api/v1/rentals/unlock",
        headers=auth_header(renter_token),
        json={"property_id": prop_id},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["amount_paid"] == 5000
    assert data["owner_phone"] == "0712100001"
    assert data["owner_name"] == "Landlord"


def test_end_rental(client):
    landlord_token, tenant_token, prop_id, rental_id = setup_rental(client)

    resp = client.post(
        f"/api/v1/rentals/{rental_id}/end",
        headers=auth_header(landlord_token),
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "ended"
