"""API endpoint integration tests for Unified Multi-Hazard routes."""

import pytest
from fastapi.testclient import TestClient
from app.api.deps import get_current_user
from app.main import app


class MockUser:
    id = "usr-test-admin"
    email = "admin@sentra.gov.in"
    full_name = "Test Commander"
    is_active = True
    geographic_scope = "NATIONAL"
    assigned_state_id = None
    assigned_district_id = None
    roles = []


@pytest.fixture(autouse=True)
def mock_db_check(monkeypatch):
    monkeypatch.setattr("app.main.check_db_connection", lambda: (True, None))


@pytest.fixture
def client():
    app.dependency_overrides[get_current_user] = lambda: MockUser()
    with TestClient(app, raise_server_exceptions=False) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def test_api_list_supported_hazards(client):
    """Test GET /api/v1/hazards returns all seven hazards."""
    res = client.get("/api/v1/hazards")
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 7
    hazard_types = [h["hazard_type"] for h in data]
    assert "FLOOD" in hazard_types
    assert "EARTHQUAKE" in hazard_types
    assert "DROUGHT" in hazard_types
    assert "TSUNAMI" in hazard_types


def test_api_models_status(client):
    """Test GET /api/v1/hazards/models/status returns status for all 7 hazards."""
    res = client.get("/api/v1/hazards/models/status")
    assert res.status_code == 200
    statuses = res.json()
    assert len(statuses) == 7
    status_by_hazard = {s["hazard_type"]: s for s in statuses}
    assert status_by_hazard["FLOOD"]["is_available"] is True
    assert status_by_hazard["EARTHQUAKE"]["is_available"] is True
    assert status_by_hazard["DROUGHT"]["is_available"] is True
    assert status_by_hazard["TSUNAMI"]["is_available"] is True
    assert status_by_hazard["TSUNAMI"]["readiness_status"] == "OPERATIONAL_VALIDATED"


def test_api_readiness_detailed(client):
    """Test GET /api/v1/hazards/readiness/detailed returns deep metrics and blocker details."""
    res = client.get("/api/v1/hazards/readiness/detailed")
    assert res.status_code == 200
    items = res.json()
    assert len(items) == 7
    ts_item = next(i for i in items if i["hazard_type"] == "TSUNAMI")
    assert ts_item["wave_propagation"] == "CALIBRATED"
    assert ts_item["coastal_inundation"] == "CALIBRATED"
    assert ts_item["blocker_reason"] is None
    assert ts_item["is_available"] is True


def test_api_historical_events(client):
    """Test GET /api/v1/hazards/historical/events filters properly."""
    res = client.get("/api/v1/hazards/historical/events")
    assert res.status_code == 200
    events = res.json()
    assert len(events) >= 8

    res_fl = client.get("/api/v1/hazards/historical/events?hazard_type=FLOOD")
    assert res_fl.status_code == 200
    fl_events = res_fl.json()
    assert all(e["hazard_type"] == "FLOOD" for e in fl_events)


def test_api_geospatial_envelope(client):
    """Test GET /api/v1/hazards/{hazard_type}/envelope calculates valid impact radius."""
    res = client.get("/api/v1/hazards/EARTHQUAKE/envelope?latitude=23.4&longitude=70.1&severity=CRITICAL&primary_metric=7.2")
    assert res.status_code == 200
    env = res.json()
    assert env["estimated_impact_radius_km"] > 30.0
    assert env["center"]["latitude"] == 23.4


def test_api_simulate_flood_success(client):
    """Test POST /api/v1/hazards/FLOOD/simulate executes validated inference."""
    payload = {
        "rainfall_24h_mm": 110.0,
        "cumulative_rainfall_72h_mm": 200.0,
        "river_water_level_m": 51.5,
        "danger_level_m": 50.0,
    }
    res = client.post("/api/v1/hazards/FLOOD/simulate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["hazard_type"] == "FLOOD"
    assert data["risk_score"] > 50.0
    assert data["severity_level"] in ["HIGH", "CRITICAL"]


def test_api_simulate_tsunami_success(client):
    """Test POST /api/v1/hazards/TSUNAMI/simulate executes operational unblocked inference."""
    res = client.post(
        "/api/v1/hazards/TSUNAMI/simulate",
        json={
            "undersea_earthquake_magnitude": 8.4,
            "focal_depth_km": 15.0,
            "bathymetry_depth_m": 3500.0,
            "coastal_distance_km": 120.0,
            "fault_mechanism": "THRUST",
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data["hazard_type"] == "TSUNAMI"
    assert data["risk_score"] > 50.0
    assert data["primary_metric_name"] == "Predicted Coastal Runup Height"
    assert data["primary_metric_value"] > 0.5
    assert "shallow_water_wave_speed_kmh" in data["secondary_metrics"]


def test_api_district_baseline_impact(client):
    """Test GET /api/v1/hazards/districts/{name}/baseline returns real baseline metrics."""
    res = client.get("/api/v1/hazards/districts/Krishna/baseline")
    assert res.status_code == 200
    data = res.json()
    assert data["found"] is True
    assert data["metrics"]["district_name"] == "Krishna"
    assert data["metrics"]["population"] > 4000000
    assert data["metrics"]["human_fatality_historical"] > 0
