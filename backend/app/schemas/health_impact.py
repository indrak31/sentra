"""Health-impact estimation schemas."""

from datetime import datetime
from typing import Any, Dict, Optional
from pydantic import BaseModel, ConfigDict, Field


class HealthImpactEstimateRequest(BaseModel):
    district_id: str
    risk_assessment_id: Optional[str] = Field(
        None,
        description="ID of a validated upstream RiskAssessment. If omitted, explicit severity score must be supplied.",
    )
    hazard_severity_score: Optional[float] = Field(
        None,
        ge=0.0,
        le=1.0,
        description="Direct hazard severity score (0.0 to 1.0) for simulation or testing when no upstream ML model is available",
    )
    vulnerability_factor: float = Field(
        0.5,
        ge=0.0,
        le=1.0,
        description="Local vulnerability multiplier (0.0 = highly resilient, 1.0 = highly vulnerable)",
    )
    exposed_population_override: Optional[int] = Field(
        None,
        ge=0,
        description="Override exposed population count instead of using district population database record",
    )


class HealthImpactRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    risk_assessment_id: Optional[str] = None
    district_id: str
    status: str
    exposed_population: int
    estimated_affected: int
    vulnerability_indicators: Dict[str, Any]
    estimated_medical_demand: Dict[str, Any]
    estimation_method: str
    estimation_version: str
    assumptions: Dict[str, Any]
    limitations: Optional[str] = None
    created_at: datetime
