"""Abstract base predictor contract for SENTRA hazard models."""

from abc import ABC, abstractmethod
from typing import Any, Dict, List
from app.schemas.risk_assessment import HazardType


class BasePredictor(ABC):
    """Abstract interface that all hazard-specific ML predictors must implement."""

    @property
    @abstractmethod
    def hazard_type(self) -> HazardType:
        """The specific hazard category this predictor serves."""
        pass

    @property
    @abstractmethod
    def model_name(self) -> str:
        """Identifier name of the model."""
        pass

    @property
    @abstractmethod
    def model_version(self) -> str:
        """Version string of the model."""
        pass

    @property
    @abstractmethod
    def is_available(self) -> bool:
        """Whether a trained model artifact is active and ready for inference."""
        pass

    @property
    @abstractmethod
    def readiness_status(self) -> str:
        """Readiness state: e.g. MODEL_READY, NOT_TRAINED, TRAINING_PENDING."""
        pass

    @property
    @abstractmethod
    def description(self) -> str:
        """Description of the hazard model methodology and domain."""
        pass

    @property
    @abstractmethod
    def expected_inputs(self) -> List[str]:
        """List of expected input features/observations for inference."""
        pass

    @abstractmethod
    def validate_inputs(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate input features against scientific and preprocessing schema."""
        pass

    @abstractmethod
    def predict(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute model inference and return typed risk assessment result."""
        pass
