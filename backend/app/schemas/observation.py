"""Environmental observation schemas."""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


VALID_OBS_TYPES = (
    "RAINFALL",
    "RIVER_LEVEL",
    "TEMPERATURE",
    "WIND_SPEED",
    "SEISMIC_INTENSITY",
    "HUMIDITY",
    "SOIL_MOISTURE",
)


class ObservationCreate(BaseModel):
    district_id: str
    location_id: Optional[str] = None
    observation_type: str = Field(
        ...,
        description="Supported types: RAINFALL, RIVER_LEVEL, TEMPERATURE, WIND_SPEED, SEISMIC_INTENSITY, HUMIDITY, SOIL_MOISTURE",
    )
    value: float
    unit: str = Field(..., min_length=1, max_length=20)
    timestamp: datetime
    data_source: str = Field(..., min_length=2, max_length=100)
    external_record_id: Optional[str] = Field(None, max_length=100)
    quality_status: str = Field("UNVERIFIED", pattern="^(VERIFIED|UNVERIFIED|SUSPECT)$")


class ObservationBulkCreate(BaseModel):
    observations: List[ObservationCreate] = Field(..., min_length=1, max_length=500)


class ObservationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    district_id: str
    location_id: Optional[str] = None
    observation_type: str
    value: float
    unit: str
    timestamp: datetime
    data_source: str
    external_record_id: Optional[str] = None
    quality_status: str
    ingestion_timestamp: datetime
