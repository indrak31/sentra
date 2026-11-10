"""State, District, and Location schemas."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class StateCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    code: str = Field(..., min_length=2, max_length=10)
    is_active: bool = True


class StateRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    code: str
    is_active: bool
    created_at: datetime


class DistrictCreate(BaseModel):
    state_id: str
    name: str = Field(..., min_length=2, max_length=100)
    code: str = Field(..., min_length=2, max_length=20)
    population: int = Field(0, ge=0)
    area_sq_km: Optional[float] = Field(None, ge=0)
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)


class DistrictRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    state_id: str
    name: str
    code: str
    population: int
    area_sq_km: Optional[float] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    created_at: datetime


class LocationCreate(BaseModel):
    district_id: str
    name: str = Field(..., min_length=2, max_length=150)
    location_type: str = Field(
        ...,
        pattern="^(HOSPITAL|SHELTER|STAGING_AREA|OBSERVATION_STATION|DEMAND_ZONE)$",
        description="Type: HOSPITAL, SHELTER, STAGING_AREA, OBSERVATION_STATION, DEMAND_ZONE",
    )
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    address: Optional[str] = None


class LocationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    district_id: str
    name: str
    location_type: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None
    created_at: datetime
