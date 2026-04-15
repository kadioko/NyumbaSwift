from tests.conftest import auth_header, register_user


def test_landlord_summary_empty(client):
    token = register_user(
        client, phone="0712300001", name="Landlord", role="landlord", email="landlord-summary@example.com"
    ).json()["access_token"]

    resp = client.get(
        "/api/v1/dashboard/landlord/summary",
        headers=auth_header(token),
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_properties"] == 0
    assert data["active_rentals"] == 0
    assert data["total_rent_collected_tzs"] == 0


def test_landlord_summary_with_data(client, mock_snippe_processing):
    # Setup landlord with property and rental
    landlord_resp = register_user(
        client, phone="0712300002", name="Landlord2", role="landlord", email="landlord2@example.com"
    )
    landlord_token = landlord_resp.json()["access_token"]

    tenant_resp = register_user(
        client, phone="0712300003", name="Tenant", role="renter", email="tenant-summary@example.com"
    )
    tenant_id = tenant_resp.json()["user"]["id"]
    tenant_token = tenant_resp.json()["access_token"]

    # Create property
    prop_resp = client.post(
        "/api/v1/properties/",
        headers=auth_header(landlord_token),
        json={
            "title": "Test Unit",
            "description": "Test",
            "property_type": "apartment",
            "district": "Kinondoni",
            "ward": "Msasani",
            "street": "Test St",
            "rent_amount": 400000,
        },
    )
    prop_id = prop_resp.json()["id"]

    # Create rental
    rental_resp = client.post(
        "/api/v1/rentals/",
        headers=auth_header(landlord_token),
        json={
            "property_id": prop_id,
            "tenant_id": tenant_id,
            "monthly_rent": 400000,
            "start_date": "2026-03-01T00:00:00Z",
        },
    )
    rental_id = rental_resp.json()["id"]

    # Make a payment
    pay_resp = client.post(
        "/api/v1/rentals/payments",
        headers=auth_header(tenant_token),
        json={"rental_id": rental_id, "payment_month": "2026-03"},
    )
    payment_id = pay_resp.json()["id"]

    # Confirm payment
    client.post(
        f"/api/v1/rentals/payments/{payment_id}/confirm?mpesa_reference=MPESA456",
        headers=auth_header(tenant_token),
    )

    # Check dashboard
    resp = client.get(
        "/api/v1/dashboard/landlord/summary",
        headers=auth_header(landlord_token),
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_properties"] == 1
    assert data["active_rentals"] == 1
    assert data["total_rent_collected_tzs"] == 394000  # 400000 - 1.5% fee
    assert data["total_platform_fees_tzs"] == 6000


def test_renter_cannot_access_landlord_dashboard(client):
    token = register_user(client, phone="0712300004", name="Renter").json()[
        "access_token"
    ]
    resp = client.get(
        "/api/v1/dashboard/landlord/summary",
        headers=auth_header(token),
    )
    assert resp.status_code == 403
