"""Central registry for hazard prediction model adapters."""

from typing import Dict, List, Optional
from app.hazards.services.hazard_registry import hazard_registry
from app.prediction.adapter import HazardModulePredictorAdapter
from app.prediction.base import BasePredictor
from app.schemas.risk_assessment import HazardModelStatus, HazardType


class PredictorRegistry:
    """Registry maintaining active adapters for all 7 hazard types."""

    def __init__(self):
        self._predictors: Dict[HazardType, BasePredictor] = {}
        self._initialize_adapters()

    def _initialize_adapters(self) -> None:
        """Register adapters for all hazard modules from the unified HazardRegistry."""
        for module in hazard_registry.list_all_modules():
            self._predictors[module.hazard_type] = HazardModulePredictorAdapter(module)

    def register(self, hazard_type: HazardType, predictor: BasePredictor) -> None:
        """Register a concrete predictor adapter."""
        self._predictors[hazard_type] = predictor

    def get(self, hazard_type: HazardType) -> Optional[BasePredictor]:
        """Retrieve the configured predictor for a hazard type."""
        return self._predictors.get(hazard_type)

    def get_all_statuses(self) -> List[HazardModelStatus]:
        """Return readiness and capability status for all seven hazard models."""
        statuses = []
        for hazard_type, predictor in self._predictors.items():
            statuses.append(
                HazardModelStatus(
                    hazard_type=hazard_type,
                    model_name=predictor.model_name,
                    model_version=predictor.model_version,
                    is_available=predictor.is_available,
                    readiness_status=predictor.readiness_status,
                    description=predictor.description,
                    expected_inputs=predictor.expected_inputs,
                )
            )
        return statuses


# System-wide singleton registry instance
predictor_registry = PredictorRegistry()
