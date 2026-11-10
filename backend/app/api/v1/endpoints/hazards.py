"""Hazard metadata, historical event intelligence, and model readiness endpoints."""

from typing import Annotated, Any, Dict, List, Optional
from fastapi import APIRouter, Depends, Query
from app.api.deps import get_current_user
from app.core.exceptions import EntityNotFoundException
from app.hazards.base import HazardReadinessInfo, HistoricalEvent
from app.hazards.services.geospatial_hazard_service import geospatial_hazard_service
from app.hazards.services.hazard_data_service import hazard_data_service
from app.hazards.services.hazard_inference_service import hazard_inference_service
from app.hazards.services.hazard_readiness_service import hazard_readiness_service
from app.hazards.services.hazard_registry import hazard_registry
from app.models.user import User
from app.prediction.registry import predictor_registry
from app.schemas.risk_assessment import HazardModelStatus, HazardType

router = APIRouter(prefix="/hazards", tags=["Hazards & Models"])


@router.get("", response_model=List[Dict[str, Any]])
def list_supported_hazards(
    _: Annotated[User, Depends(get_current_user)],
) -> List[Dict[str, Any]]:
    """List the seven disaster hazards supported by SENTRA with domain metadata and readiness."""
    results = []
    for module in hazard_registry.list_all_modules():
        r = module.readiness_info
        results.append(
            {
                "hazard_type": r.hazard_type.value,
                "name": r.model_name,
                "version": r.model_version,
                "description": r.scientific_methodology,
                "expected_features": r.expected_inputs,
                "input_units": r.input_units,
                "is_available": r.is_available,
                "readiness_status": r.readiness_status,
                "wave_propagation": r.wave_propagation,
                "coastal_inundation": r.coastal_inundation,
                "blocker_reason": r.blocker_reason,
            }
        )
    return results


@router.get("/models/status", response_model=List[HazardModelStatus])
def get_model_readiness_status(
    _: Annotated[User, Depends(get_current_user)],
) -> List[HazardModelStatus]:
    """Report the deployment and readiness status of each of the seven hazard models."""
    return predictor_registry.get_all_statuses()


@router.get("/readiness/detailed", response_model=List[HazardReadinessInfo])
def get_detailed_readiness(
    _: Annotated[User, Depends(get_current_user)],
) -> List[HazardReadinessInfo]:
    """Return in-depth scientific readiness, calibration metrics, and blocker status across all hazards."""
    return hazard_readiness_service.list_all_readiness()


@router.get("/historical/events", response_model=List[HistoricalEvent])
def get_historical_disaster_events(
    _: Annotated[User, Depends(get_current_user)],
    hazard_type: Optional[str] = Query(None),
    state_code: Optional[str] = Query(None),
    min_year: Optional[int] = Query(None),
) -> List[HistoricalEvent]:
    """Query verified ground-truth historical disaster events for comparative intelligence."""
    ht = None
    if hazard_type:
        try:
            ht = HazardType(hazard_type.upper())
        except ValueError:
            raise EntityNotFoundException("HazardType", hazard_type)

    return hazard_data_service.get_historical_intelligence(hazard_type=ht, state_code=state_code, min_year=min_year)


@router.get("/districts/{district_name}/baseline", response_model=Dict[str, Any])
def get_district_baseline_impact(
    district_name: str,
    _: Annotated[User, Depends(get_current_user)],
) -> Dict[str, Any]:
    """Return authentic historical vulnerability, population, and flood impact baseline for an Indian district."""
    baseline = hazard_data_service.get_district_impact_baseline(district_name)
    if not baseline:
        return {
            "district_name": district_name,
            "found": False,
            "message": "District baseline not found in 732-district inventory",
        }
    return {
        "district_name": district_name,
        "found": True,
        "metrics": baseline,
    }


@router.get("/{hazard_type}", response_model=Dict[str, Any])
def get_hazard_details(
    hazard_type: str,
    _: Annotated[User, Depends(get_current_user)],
) -> Dict[str, Any]:
    """Get complete metadata, scientific methodology, and historical events for a specific hazard."""
    try:
        ht = HazardType(hazard_type.upper())
    except ValueError:
        raise EntityNotFoundException("HazardType", hazard_type)

    module = hazard_registry.get_module(ht)
    if not module:
        raise EntityNotFoundException("HazardModule", hazard_type)

    r = module.readiness_info
    return {
        "hazard_type": r.hazard_type.value,
        "name": r.model_name,
        "version": r.model_version,
        "is_available": r.is_available,
        "readiness_status": r.readiness_status,
        "wave_propagation": r.wave_propagation,
        "coastal_inundation": r.coastal_inundation,
        "blocker_reason": r.blocker_reason,
        "scientific_methodology": r.scientific_methodology,
        "expected_features": r.expected_inputs,
        "input_units": r.input_units,
        "evaluation_metrics": [m.model_dump() for m in r.evaluation_metrics],
        "provenance_reference": r.provenance_reference,
        "historical_events_count": len(module.historical_events),
    }


@router.get("/{hazard_type}/envelope", response_model=Dict[str, Any])
def get_geospatial_impact_envelope(
    hazard_type: str,
    latitude: float = Query(...),
    longitude: float = Query(...),
    severity: str = Query("HIGH"),
    primary_metric: Optional[float] = Query(None),
    _: Annotated[User, Depends(get_current_user)] = None,
) -> Dict[str, Any]:
    """Compute estimated geospatial impact buffer and envelope for a hazard scenario."""
    try:
        ht = HazardType(hazard_type.upper())
    except ValueError:
        raise EntityNotFoundException("HazardType", hazard_type)

    return geospatial_hazard_service.compute_hazard_impact_envelope(
        hazard_type=ht,
        latitude=latitude,
        longitude=longitude,
        severity_level=severity.upper(),
        primary_metric_value=primary_metric,
    )


@router.post("/{hazard_type}/simulate", response_model=Dict[str, Any])
def simulate_hazard_risk(
    hazard_type: str,
    input_payload: Dict[str, Any],
    _: Annotated[User, Depends(get_current_user)],
) -> Dict[str, Any]:
    """Execute direct validated hazard computation or return typed unavailable error (for research sandbox)."""
    try:
        ht = HazardType(hazard_type.upper())
    except ValueError:
        raise EntityNotFoundException("HazardType", hazard_type)

    result = hazard_inference_service.execute_inference(ht, input_payload)
    return result.model_dump()
