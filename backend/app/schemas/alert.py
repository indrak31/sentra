"""Alert schemas."""

from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.risk_assessment import HazardType


class AlertSeverityEnum(str, Enum):
    LOW = "LOW"
    MODERATE = "MODERATE"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class AlertStatusEnum(str, Enum):
    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    RESOLVED = "RESOLVED"
    CANCELLED = "CANCELLED"


class AlertCreate(BaseModel):
    district_id: str
    hazard_type: HazardType
    risk_assessment_id: Optional[str] = None
    severity: AlertSeverityEnum = AlertSeverityEnum.MODERATE
    title: str = Field(..., min_length=5, max_length=200)
    description: str = Field(..., min_length=10, max_length=1000)


class AlertUpdate(BaseModel):
    severity: Optional[AlertSeverityEnum] = None
    status: Optional[AlertStatusEnum] = None
    title: Optional[str] = Field(None, min_length=5, max_length=200)
    description: Optional[str] = Field(None, min_length=10, max_length=1000)


class AlertRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    district_id: str
    hazard_type: str
    risk_assessment_id: Optional[str] = None
    severity: str
    status: str
    title: str
    description: str
    issued_by: str
    acknowledged_by: Optional[str] = None
    acknowledged_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
