from tests.conftest import auth_header, register_user


def test_apply_as_agent(client):
    token = register_user(client, phone="0712200001", name="Broker").json()[
        "access_token"
    ]
    resp = client.post(
        "/api/v1/agents/apply",
        headers=auth_header(token),
        json={
            "business_name": "Dar Homes Agency",
            "bio": "10 years in Dar rental market",
            "operating_districts": "Kinondoni,Ilala,Temeke",
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["status"] == "pending"
    assert data["operating_districts"] == "Kinondoni,Ilala,Temeke"


def test_duplicate_application_blocked(client):
    token = register_user(client, phone="0712200002", name="Broker2").json()[
        "access_token"
    ]
    client.post(
        "/api/v1/agents/apply",
        headers=auth_header(token),
        json={"operating_districts": "Kinondoni"},
    )
    resp = client.post(
        "/api/v1/agents/apply",
        headers=auth_header(token),
        json={"operating_districts": "Ilala"},
    )
    assert resp.status_code == 400


def test_admin_approve_agent(client):
    # Broker applies
    broker_resp = register_user(client, phone="0712200003", name="Broker3")
    broker_token = broker_resp.json()["access_token"]
    apply_resp = client.post(
        "/api/v1/agents/apply",
        headers=auth_header(broker_token),
        json={"operating_districts": "Kinondoni"},
    )
    agent_id = apply_resp.json()["id"]

    # Admin approves
    admin_token = register_user(
        client, phone="0712200099", name="Admin", role="admin"
    ).json()["access_token"]

    resp = client.post(
        f"/api/v1/agents/{agent_id}/review",
        headers=auth_header(admin_token),
        json={"status": "approved", "commission_rate": 12.5},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "approved"
    assert data["commission_rate"] == 12.5

    # Verify user role was upgraded
    me_resp = client.get("/api/v1/auth/me", headers=auth_header(broker_token))
    assert me_resp.json()["role"] == "agent"


def test_list_approved_agents(client):
    # Create and approve an agent
    broker_token = register_user(
        client, phone="0712200004", name="Broker4"
    ).json()["access_token"]
    apply_resp = client.post(
        "/api/v1/agents/apply",
        headers=auth_header(broker_token),
        json={"operating_districts": "Temeke"},
    )
    agent_id = apply_resp.json()["id"]

    admin_token = register_user(
        client, phone="0712200098", name="Admin2", role="admin"
    ).json()["access_token"]
    client.post(
        f"/api/v1/agents/{agent_id}/review",
        headers=auth_header(admin_token),
        json={"status": "approved"},
    )

    # List agents
    resp = client.get("/api/v1/agents/")
    assert resp.status_code == 200
    assert len(resp.json()) == 1
