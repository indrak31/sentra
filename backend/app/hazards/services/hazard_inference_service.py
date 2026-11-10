"""Hazard inference service enforcing scientific validation gates before execution."""

from typing import Any, Dict
from app.core.exceptions import EntityNotFoundException, ModelUnavailableException
from app.hazards.base import HazardPredictionOutput
from app.hazards.services.hazard_registry import hazard_registry
from app.schemas.risk_assessment import HazardType


class HazardInferenceService:
    """Orchestrates model inference across independent hazard modules with strict scientific validation gates."""

    def execute_inference(
        self,
        hazard_type: HazardType,
        input_data: Dict[str, Any],
    ) -> HazardPredictionOutput:
        """Execute risk computation on validated hazard module or raise explicit unavailable exception."""
        module = hazard_registry.get_module(hazard_type)
        if not module:
            raise EntityNotFoundException("HazardModule", hazard_type.value)

        readiness = module.readiness_info
        if not readiness.is_available:
            details = readiness.blocker_reason or f"The predictive model for {hazard_type.value} is uncalibrated ({readiness.readiness_status})."
            raise ModelUnavailableException(
                hazard_type=hazard_type.value,
                details=details,
            )

        validated_features = module.validate_features(input_data)
        return module.compute_risk(validated_features)


hazard_inference_service = HazardInferenceService()

