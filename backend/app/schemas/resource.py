"""Resource management schemas."""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, Optional
from pydantic import BaseModel, ConfigDict, Field, model_validator


class ResourceTypeEnum(str, Enum):
    AMBULANCE = "AMBULANCE"
    HOSPITAL_BED = "HOSPITAL_BED"
    MEDICAL_TEAM = "MEDICAL_TEAM"
    TEMPORARY_SHELTER = "TEMPORARY_SHELTER"
    RESCUE_TEAM = "RESCUE_TEAM"
    RELIEF_SUPPLY_PACK = "RELIEF_SUPPLY_PACK"


class OperationalStatusEnum(str, Enum):
    OPERATIONAL = "OPERATIONAL"
    DEGRADED = "DEGRADED"
    OFFLINE = "OFFLINE"


class ResourceCreate(BaseModel):
    district_id: str
    location_id: Optional[str] = None
    resource_type: ResourceTypeEnum
    name: str = Field(..., min_length=2, max_length=150)
    total_capacity: int = Field(..., ge=0)
    available_capacity: int = Field(..., ge=0)
    operational_status: OperationalStatusEnum = OperationalStatusEnum.OPERATIONAL
    capabilities: Dict[str, Any] = Field(default_factory=dict)

    @model_validator(mode="after")
    def validate_capacity(self) -> "ResourceCreate":
        if self.available_capacity > self.total_capacity:
            raise ValueError("available_capacity cannot exceed total_capacity.")
        return self


class ResourceUpdate(BaseModel):
    name: Optional[str] = None
    total_capacity: Optional[int] = Field(None, ge=0)
    available_capacity: Optional[int] = Field(None, ge=0)
    operational_status: Optional[OperationalStatusEnum] = None
    capabilities: Optional[Dict[str, Any]] = None


class ResourceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    district_id: str
    location_id: Optional[str] = None
    resource_type: str
    name: str
    total_capacity: int
    available_capacity: int
    operational_status: str
    capabilities: Dict[str, Any]
    created_at: datetime
    updated_at: datetime
