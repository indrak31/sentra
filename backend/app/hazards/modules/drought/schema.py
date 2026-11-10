"""Agro-meteorological and hydrological data schema for Drought hazard module."""

from typing import Optional
from pydantic import BaseModel, Field


class DroughtFeatureInput(BaseModel):
    """Input parameters for multi-index meteorological and agricultural drought modeling."""
    rainfall_deficit_pct: float = Field(..., ge=-100.0, le=100.0, description="Percentage deviation from long-period average (LPA) monsoon rainfall")
    spei_index: float = Field(..., ge=-4.5, le=4.5, description="Standardized Precipitation Evapotranspiration Index (SPEI-3 or SPEI-6)")
    soil_moisture_pct: float = Field(..., ge=0.0, le=100.0, description="Volumetric root-zone soil moisture content percentage")
    consecutive_dry_days: int = Field(..., ge=0, le=365, description="Number of consecutive dry days (< 2.5 mm rainfall)")
    reservoir_storage_pct: Optional[float] = Field(default=35.0, ge=0.0, le=100.0, description="District irrigation dam live storage percentage")
    groundwater_table_depletion_m: Optional[float] = Field(default=1.8, ge=-10.0, le=50.0, description="Groundwater table decline in meters below 10-year pre-monsoon mean")
    ndvi_anomaly_pct: Optional[float] = Field(default=-15.0, ge=-100.0, le=100.0, description="Normalized Difference Vegetation Index (NDVI) anomaly percentage")

