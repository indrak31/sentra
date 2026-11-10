"""Comprehensive unit and integration test suite for SENTRA Unified Multi-Hazard Platform."""

import pytest
from app.core.exceptions import ModelUnavailableException
from app.hazards.base import HazardType
from app.hazards.services.geospatial_hazard_service import geospatial_hazard_service
from app.hazards.services.hazard_data_service import hazard_data_service
from app.hazards.services.hazard_feature_service import hazard_feature_service
from app.hazards.services.hazard_inference_service import hazard_inference_service
from app.hazards.services.hazard_readiness_service import hazard_readiness_service
from app.hazards.services.hazard_registry import hazard_registry
from app.prediction.registry import predictor_registry


def test_hazard_registry_all_seven_hazards_registered():
    """Verify that all seven hazard modules are registered in the HazardRegistry."""
    modules = hazard_registry.list_all_modules()
    assert len(modules) == 7
    registered_types = {m.hazard_type for m in modules}
    expected_types = {
        HazardType.FLOOD,
        HazardType.EARTHQUAKE,
        HazardType.DROUGHT,
        HazardType.TSUNAMI,
        HazardType.CYCLONE,
        HazardType.LANDSLIDE,
        HazardType.HEATWAVE,
    }
    assert registered_types == expected_types


def test_tsunami_readiness_status_unblocked():
    """Verify that Tsunami is OPERATIONAL_VALIDATED, wave_propagation=CALIBRATED, coastal_inundation=CALIBRATED."""
    ts_module = hazard_registry.get_module(HazardType.TSUNAMI)
    assert ts_module is not None
    info = ts_module.readiness_info
    assert info.is_available is True
    assert info.readiness_status == "OPERATIONAL_VALIDATED"
    assert info.wave_propagation == "CALIBRATED"
    assert info.coastal_inundation == "CALIBRATED"
    assert info.blocker_reason is None
    assert len(info.evaluation_metrics) >= 2


def test_tsunami_inference_execution():
    """Verify that running inference on Tsunami produces validated hydrodynamic prediction output."""
    res = hazard_inference_service.execute_inference(
        HazardType.TSUNAMI,
        {
            "undersea_earthquake_magnitude": 8.4,
            "focal_depth_km": 15.0,
            "bathymetry_depth_m": 3500.0,
            "coastal_distance_km": 120.0,
            "fault_mechanism": "THRUST",
        },
    )
    assert res.hazard_type == HazardType.TSUNAMI
    assert res.risk_score > 50.0
    assert res.primary_metric_name == "Predicted Coastal Runup Height"
    assert res.primary_metric_value > 0.5
    assert "shallow_water_wave_speed_kmh" in res.secondary_metrics


def test_planned_modules_readiness():
    """Verify that Cyclone, Landslide, Heatwave are in PLANNED_RESEARCH status and blocked from fake predictions."""
    for ht in [HazardType.CYCLONE, HazardType.LANDSLIDE, HazardType.HEATWAVE]:
        mod = hazard_registry.get_module(ht)
        assert mod is not None
        assert mod.readiness_info.is_available is False
        assert mod.readiness_info.readiness_status == "PLANNED_RESEARCH"
        with pytest.raises(ModelUnavailableException):
            hazard_inference_service.execute_inference(ht, {})


def test_flood_inference_validation():
    """Verify hydrological flood runoff assessment with valid features."""
    input_data = {
        "rainfall_24h_mm": 120.0,
        "cumulative_rainfall_72h_mm": 210.0,
        "river_water_level_m": 51.8,
        "danger_level_m": 50.0,
        "catchment_area_sq_km": 3000.0,
        "runoff_coefficient": 0.70,
    }
    output = hazard_inference_service.execute_inference(HazardType.FLOOD, input_data)
    assert output.hazard_type == HazardType.FLOOD
    assert 0.0 <= output.risk_score <= 100.0
    assert output.severity_level in ["MODERATE", "HIGH", "CRITICAL"]
    assert output.primary_metric_name in ["Peak Estimated Catchment Discharge", "RandomForest Severe Flood Probability"]
    assert output.primary_metric_value > 0.0
    assert len(output.recommended_actions) > 0


def test_flood_colab_10_lag_features_support(monkeypatch):
    """Verify that Colab 10-lag features [T1d..T10d] and RandomForest model inference work properly."""
    from unittest.mock import MagicMock
    import numpy as np
    from app.hazards.modules.flood import inference as flood_inf

    # Mock a trained RandomForest pipeline that returns probability
    mock_rf = MagicMock()
    mock_rf.predict_proba.return_value = np.array([[0.18, 0.82]])

    monkeypatch.setattr(flood_inf, "load_flood_ml_model", lambda: (mock_rf, "sentra_rf_threshold_tuned.joblib"))

    input_data = {
        "T1d": 25.5, "T2d": 78.2, "T3d": 12.5, "T4d": 45.3, "T5d": 10.2,
        "T6d": 5.4,  "T7d": 2.3,  "T8d": 1.1,  "T9d": 0.5,  "T10d": 0.1,
        "river_water_level_m": 52.5,
        "danger_level_m": 52.0,
    }
    output = hazard_inference_service.execute_inference(HazardType.FLOOD, input_data)
    assert output.hazard_type == HazardType.FLOOD
    assert output.primary_metric_name == "RandomForest Severe Flood Probability"
    assert output.primary_metric_value == 0.82
    assert output.risk_score == 82.0
    assert output.severity_level == "CRITICAL"
    assert output.confidence_score >= 0.75
    assert "sentra_rf_threshold_tuned.joblib" in output.secondary_metrics["model_artifact"]


def test_earthquake_inference_validation():
    """Verify seismic GMPE ground motion calculation with valid features."""
    input_data = {
        "magnitude_mw": 7.2,
        "focal_depth_km": 12.0,
        "hypocentral_distance_km": 35.0,
        "seismic_zone": "ZONE_V",
        "soil_class": "MEDIUM",
    }
    output = hazard_inference_service.execute_inference(HazardType.EARTHQUAKE, input_data)
    assert output.hazard_type == HazardType.EARTHQUAKE
    assert 0.0 <= output.risk_score <= 100.0
    assert output.severity_level in ["HIGH", "CRITICAL"]
    assert output.primary_metric_name == "Peak Ground Acceleration (PGA)"
    assert output.primary_metric_value > 0.10
    assert output.primary_metric_unit == "g"
    assert "estimated_mmi_intensity" in output.secondary_metrics


def test_drought_inference_validation():
    """Verify agro-meteorological drought multi-index calculation."""
    input_data = {
        "rainfall_deficit_pct": -48.0,
        "spei_index": -1.85,
        "soil_moisture_pct": 16.0,
        "consecutive_dry_days": 42,
        "reservoir_storage_pct": 18.0,
    }
    output = hazard_inference_service.execute_inference(HazardType.DROUGHT, input_data)
    assert output.hazard_type == HazardType.DROUGHT
    assert 0.0 <= output.risk_score <= 100.0
    assert output.severity_level in ["HIGH", "CRITICAL"]
    assert output.primary_metric_name == "Standardized Precipitation Evapotranspiration Index (SPEI)"
    assert output.primary_metric_value == -1.85


def test_historical_events_intelligence():
    """Verify historical event loading across hazards."""
    flood_events = hazard_data_service.get_historical_intelligence(HazardType.FLOOD)
    assert len(flood_events) >= 3
    assert any(e.event_id == "FL-HIST-2023-AS" for e in flood_events)

    eq_events = hazard_data_service.get_historical_intelligence(HazardType.EARTHQUAKE)
    assert len(eq_events) >= 3
    assert any(e.event_id == "EQ-HIST-2001-GJ" for e in eq_events)

    ts_events = hazard_data_service.get_historical_intelligence(HazardType.TSUNAMI)
    assert len(ts_events) >= 2
    assert any(e.event_id == "TS-HIST-2004-IO" for e in ts_events)


def test_geospatial_impact_envelope():
    """Verify physical geospatial impact envelope calculation."""
    envelope = geospatial_hazard_service.compute_hazard_impact_envelope(
        hazard_type=HazardType.EARTHQUAKE,
        latitude=23.4,
        longitude=70.1,
        severity_level="CRITICAL",
        primary_metric_value=7.7,
    )
    assert envelope["estimated_impact_radius_km"] > 50.0
    assert envelope["envelope_geometry_type"] == "CircularBuffer"


def test_predictor_registry_adapter_compatibility():
    """Verify that PredictorRegistry adapts all modules into BasePredictor seamlessly."""
    statuses = predictor_registry.get_all_statuses()
    assert len(statuses) == 7
    status_map = {s.hazard_type: s for s in statuses}

    assert status_map[HazardType.FLOOD].is_available is True
    assert status_map[HazardType.EARTHQUAKE].is_available is True
    assert status_map[HazardType.DROUGHT].is_available is True
    assert status_map[HazardType.TSUNAMI].is_available is True
    assert status_map[HazardType.TSUNAMI].readiness_status == "OPERATIONAL_VALIDATED"
    assert status_map[HazardType.CYCLONE].is_available is False
    assert status_map[HazardType.LANDSLIDE].is_available is False
    assert status_map[HazardType.HEATWAVE].is_available is False

