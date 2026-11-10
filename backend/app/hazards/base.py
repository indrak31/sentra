"""Base definitions and protocols for the SENTRA Unified Multi-Hazard Platform."""

from abc import ABC, abstractmethod
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from app.schemas.risk_assessment import HazardType


class HistoricalEvent(BaseModel):
    """Verified historical disaster event record for scientific baseline and training benchmarking."""
    event_id: str
    event_name: str
    event_year: int
    hazard_type: HazardType
    state_code: str
    state_name: str
    district_name: str
    start_date: str
    severity: str
    peak_metric_name: str
    peak_metric_value: float
    peak_metric_unit: str
    estimated_exposed_population: Optional[int] = 0
    reported_fatalities: Optional[int] = 0
    economic_loss_inr_cr: Optional[float] = 0.0
    description: str
    data_source: str


class EvaluationMetric(BaseModel):
    """Scientific evaluation and calibration metric for a hazard model."""
    metric_name: str
    value: float
    unit: Optional[str] = None
    description: str
    benchmark_dataset: str


class HazardReadinessInfo(BaseModel):
    """Comprehensive readiness, calibration, and training state for a hazard module."""
    hazard_type: HazardType
    model_name: str
    model_version: str
    is_available: bool
    readiness_status: str  # e.g. OPERATIONAL_VALIDATED, MODEL_TRAINING_BLOCKED, PLANNED_RESEARCH
    scientific_methodology: str
    expected_inputs: List[str]
    input_units: Dict[str, str] = Field(default_factory=dict)
    wave_propagation: Optional[str] = None  # Specific to Tsunami requirement
    coastal_inundation: Optional[str] = None  # Specific to Tsunami requirement
    blocker_reason: Optional[str] = None
    evaluation_metrics: List[EvaluationMetric] = Field(default_factory=list)
    last_calibrated_at: Optional[str] = None
    provenance_reference: str


class HazardPredictionOutput(BaseModel):
    """Standardized prediction and risk assessment result returned by a hazard module."""
    hazard_type: HazardType
    risk_score: float = Field(..., ge=0.0, le=100.0, description="Risk index between 0 and 100")
    severity_level: str = Field(..., description="LOW, MODERATE, HIGH, CRITICAL")
    confidence_score: float = Field(..., ge=0.0, le=1.0, description="Scientific confidence level")
    primary_metric_name: str
    primary_metric_value: float
    primary_metric_unit: str
    secondary_metrics: Dict[str, Any] = Field(default_factory=dict)
    summary: str
    recommended_actions: List[str] = Field(default_factory=list)
    assumptions_and_limitations: List[str] = Field(default_factory=list)
    calculated_at: str


class BaseHazardModule(ABC):
    """Abstract interface for an independent hazard research module."""

    @property
    @abstractmethod
    def hazard_type(self) -> HazardType:
        """The specific hazard category."""
        pass

    @property
    @abstractmethod
    def readiness_info(self) -> HazardReadinessInfo:
        """Readiness and scientific provenance metadata."""
        pass

    @property
    @abstractmethod
    def historical_events(self) -> List[HistoricalEvent]:
        """Verified historical events used for ground truthing and contextual intelligence."""
        pass

    @abstractmethod
    def validate_features(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate input features against scientific criteria."""
        pass

    @abstractmethod
    def compute_risk(self, validated_features: Dict[str, Any]) -> HazardPredictionOutput:
        """Execute validated scientific inference or raise typed exception if blocked/uncalibrated."""
        pass

