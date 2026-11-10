"""Hydrological data schema and feature definitions for Flood hazard module."""

from typing import List, Optional
from pydantic import BaseModel, Field


class FloodFeatureInput(BaseModel):
    """Input parameters for hydrological flood inundation and ML severity modeling."""
    rainfall_24h_mm: float = Field(default=35.0, ge=0.0, description="24-hour recorded or forecast rainfall in mm")
    cumulative_rainfall_72h_mm: float = Field(default=75.0, ge=0.0, description="72-hour cumulative antecedent rainfall in mm")
    river_water_level_m: float = Field(default=52.5, ge=0.0, description="Current river stage gauge level in meters")
    danger_level_m: float = Field(default=52.0, ge=0.0, description="Official Central Water Commission (CWC) danger mark in meters")
    catchment_area_sq_km: Optional[float] = Field(default=2500.0, ge=1.0, description="Upstream drainage catchment area in sq km")
    runoff_coefficient: Optional[float] = Field(default=0.65, ge=0.05, le=0.95, description="SCS runoff coefficient based on land use/soil type")
    embankment_integrity: Optional[float] = Field(default=0.85, ge=0.0, le=1.0, description="Embankment structural health index (0=breached, 1=intact)")
    drainage_capacity_index: Optional[float] = Field(default=0.70, ge=0.0, le=1.0, description="Local urban/basin drainage throughput index")

    # Colab ML Model Features: 10-day antecedent precipitation lags (T1d to T10d)
    T1d: Optional[float] = Field(default=None, description="1-day antecedent precipitation in mm")
    T2d: Optional[float] = Field(default=None, description="2-day antecedent precipitation in mm")
    T3d: Optional[float] = Field(default=None, description="3-day antecedent precipitation in mm")
    T4d: Optional[float] = Field(default=None, description="4-day antecedent precipitation in mm")
    T5d: Optional[float] = Field(default=None, description="5-day antecedent precipitation in mm")
    T6d: Optional[float] = Field(default=None, description="6-day antecedent precipitation in mm")
    T7d: Optional[float] = Field(default=None, description="7-day antecedent precipitation in mm")
    T8d: Optional[float] = Field(default=None, description="8-day antecedent precipitation in mm")
    T9d: Optional[float] = Field(default=None, description="9-day antecedent precipitation in mm")
    T10d: Optional[float] = Field(default=None, description="10-day antecedent precipitation in mm")

    def get_time_lag_vector(self) -> List[float]:
        """Return 10-day lag feature vector for Colab trained model [T1d..T10d]."""
        if self.T1d is not None:
            return [
                float(self.T1d or 0.0),
                float(self.T2d or 0.0),
                float(self.T3d or 0.0),
                float(self.T4d or 0.0),
                float(self.T5d or 0.0),
                float(self.T6d or 0.0),
                float(self.T7d or 0.0),
                float(self.T8d or 0.0),
                float(self.T9d or 0.0),
                float(self.T10d or 0.0),
            ]
        # Synthesize time lags from 24h & 72h telemetry if explicit 10-day series is omitted
        r24 = float(self.rainfall_24h_mm)
        r72 = float(self.cumulative_rainfall_72h_mm)
        rem = max(0.0, r72 - r24)
        t2 = rem * 0.6
        t3 = rem * 0.4
        decay = t3 * 0.5
        return [
            r24,
            t2,
            t3,
            decay * 0.8,
            decay * 0.6,
            decay * 0.4,
            decay * 0.3,
            decay * 0.2,
            decay * 0.1,
            decay * 0.05,
        ]


