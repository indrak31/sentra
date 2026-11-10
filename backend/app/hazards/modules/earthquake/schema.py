"""Seismic data schema and feature definitions for Earthquake hazard module."""

from typing import Optional
from pydantic import BaseModel, Field


class EarthquakeFeatureInput(BaseModel):
    """Input parameters for seismic ground motion attenuation and intensity modeling."""
    magnitude_mw: float = Field(..., ge=3.0, le=9.5, description="Moment magnitude (Mw) on Richter / USGS scale")
    focal_depth_km: float = Field(..., ge=1.0, le=700.0, description="Hypocentral depth in kilometers")
    hypocentral_distance_km: float = Field(..., ge=1.0, le=1000.0, description="Distance from hypocenter to target district centroid in km")
    seismic_zone: Optional[str] = Field(default="ZONE_IV", description="Seismic hazard zone as per IS 1893:2016 (ZONE_II, ZONE_III, ZONE_IV, ZONE_V)")
    soil_class: Optional[str] = Field(default="MEDIUM", description="Subsoil site classification: ROCK, MEDIUM, SOFT")
    vs30_m_s: Optional[float] = Field(default=360.0, ge=100.0, le=2000.0, description="Average shear-wave velocity in upper 30m (Vs30 in m/s)")
    epicentral_latitude: Optional[float] = Field(default=None, description="Epicenter latitude in degrees")
    epicentral_longitude: Optional[float] = Field(default=None, description="Epicenter longitude in degrees")

