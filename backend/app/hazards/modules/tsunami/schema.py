"""Bathymetric and subsea seismic data schema for Tsunami research module."""

from typing import Optional
from pydantic import BaseModel, Field


class TsunamiFeatureInput(BaseModel):
    """Input parameters for tsunamigenic undersea seismic and coastal runup research."""
    undersea_earthquake_magnitude: float = Field(..., ge=6.0, le=9.9, description="Undersea rupture moment magnitude (Mw)")
    focal_depth_km: float = Field(..., ge=1.0, le=150.0, description="Hypocentral depth below ocean seabed in km")
    bathymetry_depth_m: Optional[float] = Field(default=3500.0, ge=10.0, description="Ocean water column depth above rupture zone in meters")
    coastal_distance_km: Optional[float] = Field(default=120.0, ge=1.0, description="Perpendicular distance from fault rupture to coastline in km")
    fault_mechanism: Optional[str] = Field(default="THRUST", description="Seismic focal mechanism: THRUST, NORMAL, STRIKE_SLIP")
    coastal_elevation_m: Optional[float] = Field(default=3.5, ge=0.0, description="Shoreline terrain elevation above mean sea level in meters")

