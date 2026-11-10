"""Adapter bridging BaseHazardModule implementations into the BasePredictor interface."""

from typing import Any, Dict, List
from app.hazards.base import BaseHazardModule
from app.prediction.base import BasePredictor
from app.schemas.risk_assessment import HazardType


class HazardModulePredictorAdapter(BasePredictor):
    """Bridges any BaseHazardModule to the BasePredictor contract expected by RiskAssessmentService."""

    def __init__(self, module: BaseHazardModule):
        self._module = module
        self._readiness = module.readiness_info

    @property
    def hazard_type(self) -> HazardType:
        return self._module.hazard_type

    @property
    def model_name(self) -> str:
        return self._readiness.model_name

    @property
    def model_version(self) -> str:
        return self._readiness.model_version

    @property
    def is_available(self) -> bool:
        return self._readiness.is_available

    @property
    def readiness_status(self) -> str:
        return self._readiness.readiness_status

    @property
    def description(self) -> str:
        return self._readiness.scientific_methodology

    @property
    def expected_inputs(self) -> List[str]:
        return self._readiness.expected_inputs

    def validate_inputs(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        return self._module.validate_features(input_data)

    def predict(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        result = self._module.compute_risk(input_data)
        return result.model_dump()

