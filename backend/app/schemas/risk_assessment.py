"""Hazard Risk Assessment and Hazard Models schemas."""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class HazardType(str, Enum):
    FLOOD = "FLOOD"
    CYCLONE = "CYCLONE"
    EARTHQUAKE = "EARTHQUAKE"
    DROUGHT = "DROUGHT"
    LANDSLIDE = "LANDSLIDE"
    TSUNAMI = "TSUNAMI"
    HEATWAVE = "HEATWAVE"


class RiskAssessmentStatus(str, Enum):
    PENDING = "PENDING"
    SUCCEEDED = "SUCCEEDED"
    FAILED = "FAILED"
    MODEL_UNAVAILABLE = "MODEL_UNAVAILABLE"
    INSUFFICIENT_DATA = "INSUFFICIENT_DATA"


class RiskAssessmentCreate(BaseModel):
    district_id: str
    hazard_type: HazardType
    time_horizon: str = Field("24h", description="Assessment horizon e.g. 24h, 48h, 7d")
    input_data: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Optional environmental inputs snapshot to supplement/override station observations",
    )


class RiskAssessmentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    district_id: str
    hazard_type: str
    status: str
    time_horizon: str
    input_snapshot: Dict[str, Any]
    prediction_result: Optional[Dict[str, Any]] = None
    model_name: Optional[str] = None
    model_version: Optional[str] = None
    data_provenance: Optional[Dict[str, Any]] = None
    error_details: Optional[str] = None
    completed_at: Optional[datetime] = None
    created_at: datetime


class HazardModelStatus(BaseModel):
    hazard_type: HazardType
    model_name: str
    model_version: str
    is_available: bool
    readiness_status: str
    description: str
    expected_inputs: List[str]
