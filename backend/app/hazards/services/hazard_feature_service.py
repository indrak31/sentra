"""Hazard feature service for validating and transforming raw inputs into hazard-specific feature representations."""

from typing import Any, Dict
from app.core.exceptions import EntityNotFoundException
from app.hazards.services.hazard_registry import hazard_registry
from app.schemas.risk_assessment import HazardType


class HazardFeatureService:
    """Dispatches feature normalization and scientific schema validation to individual hazard modules."""

    def validate_and_extract(
        self,
        hazard_type: HazardType,
        raw_inputs: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Validate input payload against the specific hazard module's schema."""
        module = hazard_registry.get_module(hazard_type)
        if not module:
            raise EntityNotFoundException("HazardModule", hazard_type.value)

        return module.validate_features(raw_inputs)


hazard_feature_service = HazardFeatureService()

