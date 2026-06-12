from datetime import datetime, timezone

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
    assert data["wallet_id"] > 0
    assert data["wallet_balance_tzs"] == 0
    assert data["wallet_ready"] is True
    assert data["tenants_due_now"] == 0
    assert data["total_due_tzs"] == 0


def test_landlord_summary_with_data(client, mock_snippe_processing, monkeypatch):
    class FixedDateTime(datetime):
        @classmethod
        def now(cls, tz=None):
            value = cls(2026, 4, 20, 12, 0, 0, tzinfo=timezone.utc)
            if tz is None:
                return value.replace(tzinfo=None)
            return value.astimezone(tz)

    monkeypatch.setattr("app.api.dashboard.datetime", FixedDateTime)

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
    assert data["wallet_ready"] is True
    assert data["wallet_balance_tzs"] == 0
    assert data["tenants_due_now"] == 1
    assert data["overdue_rentals"] == 1
    assert data["total_due_tzs"] == 400000


def test_landlord_summary_flags_wallet_setup_if_email_missing(client):
    token = register_user(
        client, phone="0712300005", name="No Email Landlord", role="landlord"
    ).json()["access_token"]

    resp = client.get(
        "/api/v1/dashboard/landlord/summary",
        headers=auth_header(token),
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["wallet_id"] > 0
    assert data["wallet_ready"] is False
    assert "Add your email" in data["wallet_status_message"]


def test_landlord_properties_include_due_status_and_whatsapp_link(client, monkeypatch):
    class FixedDateTime(datetime):
        @classmethod
        def utcnow(cls):
            return cls(2026, 4, 20, 12, 0, 0, tzinfo=timezone.utc)

        @classmethod
        def now(cls, tz=None):
            value = cls(2026, 4, 20, 12, 0, 0, tzinfo=timezone.utc)
            if tz is None:
                return value.replace(tzinfo=None)
            return value.astimezone(tz)

    monkeypatch.setattr("app.api.dashboard.datetime", FixedDateTime)

    landlord_resp = register_user(
        client,
        phone="0712300006",
        name="Landlord Reminder",
        role="landlord",
        email="landlord-reminder@example.com",
    )
    landlord_token = landlord_resp.json()["access_token"]

    tenant_resp = register_user(
        client,
        phone="0712300007",
        name="Tenant Reminder",
        role="renter",
        email="tenant-reminder@example.com",
    )
    tenant_id = tenant_resp.json()["user"]["id"]

    prop_resp = client.post(
        "/api/v1/properties/",
        headers=auth_header(landlord_token),
        json={
            "title": "Garden Flat",
            "description": "Reminder test",
            "property_type": "apartment",
            "district": "Kinondoni",
            "ward": "Mikocheni",
            "street": "Palm Street",
            "rent_amount": 500000,
        },
    )
    prop_id = prop_resp.json()["id"]

    client.post(
        "/api/v1/rentals/",
        headers=auth_header(landlord_token),
        json={
            "property_id": prop_id,
            "tenant_id": tenant_id,
            "monthly_rent": 500000,
            "start_date": "2026-01-05T00:00:00Z",
        },
    )

    resp = client.get(
        "/api/v1/dashboard/landlord/properties",
        headers=auth_header(landlord_token),
    )
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1
    property_item = data[0]
    assert property_item["wallet_receive_ready"] is True
    rent_status = property_item["current_tenant"]["rent_status"]
    assert rent_status["has_balance_due"] is True
    assert rent_status["months_due"] == 4
    assert rent_status["days_overdue"] == 105
    assert rent_status["total_due_tzs"] == 2000000
    assert rent_status["due_months"] == ["2026-01", "2026-02", "2026-03", "2026-04"]
    assert property_item["current_tenant"]["whatsapp_url"].startswith("https://wa.me/255712300007?text=")
    assert "Ready to receive rent" in property_item["wallet_status_message"]


def test_renter_cannot_access_landlord_dashboard(client):
    token = register_user(client, phone="0712300004", name="Renter").json()[
        "access_token"
    ]
    resp = client.get(
        "/api/v1/dashboard/landlord/summary",
        headers=auth_header(token),
    )
    assert resp.status_code == 403
