"""Default unavailable predictor adapters for unsupported or untrained models."""

from typing import Any, Dict, List
from app.core.exceptions import ModelUnavailableException
from app.prediction.base import BasePredictor
from app.schemas.risk_assessment import HazardType


class UnavailableHazardPredictor(BasePredictor):
    """Predictor adapter indicating that no trained machine learning checkpoint is currently registered."""

    def __init__(
        self,
        hazard: HazardType,
        model_name: str,
        description: str,
        expected_inputs: List[str],
    ):
        self._hazard = hazard
        self._model_name = model_name
        self._description = description
        self._expected_inputs = expected_inputs

    @property
    def hazard_type(self) -> HazardType:
        return self._hazard

    @property
    def model_name(self) -> str:
        return self._model_name

    @property
    def model_version(self) -> str:
        return "0.0.0-untrained"

    @property
    def is_available(self) -> bool:
        return False

    @property
    def readiness_status(self) -> str:
        return "NOT_TRAINED"

    @property
    def description(self) -> str:
        return self._description

    @property
    def expected_inputs(self) -> List[str]:
        return self._expected_inputs

    def validate_inputs(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        return input_data

    def predict(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        raise ModelUnavailableException(
            hazard_type=self._hazard.value,
            details=(
                f"The predictive model for {self._hazard.value} is not yet trained or configured. "
                f"Expected inputs when available: {', '.join(self._expected_inputs)}."
            ),
        )


HAZARD_SPECS = {
    HazardType.FLOOD: (
        "Flood Inundation & Severity Model",
        "Hydrological runoff and river level inundation model.",
        ["rainfall", "cumulative_rainfall", "river_level", "elevation", "slope", "land_cover", "drainage_characteristics"],
    ),
    HazardType.CYCLONE: (
        "Tropical Cyclone Impact Model",
        "Atmospheric trajectory and wind speed impact predictor.",
        ["storm_position", "wind_speed", "atmospheric_pressure", "forecast_track", "coastal_exposure"],
    ),
    HazardType.EARTHQUAKE: (
        "Seismic Intensity & Shaking Model",
        "Ground acceleration and seismic shaking hazard estimation model.",
        ["seismic_observations", "earthquake_magnitude", "epicenter_coordinates", "focal_depth", "geological_conditions"],
    ),
    HazardType.DROUGHT: (
        "Agricultural & Meteorological Drought Model",
        "Soil moisture deficit and vegetation distress model.",
        ["rainfall_deficits", "soil_moisture", "temperature", "evapotranspiration", "vegetation_indicators"],
    ),
    HazardType.LANDSLIDE: (
        "Slope Stability & Landslide Susceptibility Model",
        "Precipitation-induced slope failure hazard predictor.",
        ["rainfall", "slope", "terrain", "soil_characteristics", "land_cover", "previous_landslides"],
    ),
    HazardType.TSUNAMI: (
        "Coastal Tsunami Inundation Model",
        "Subsea seismic displacement and coastal runup predictor.",
        ["undersea_earthquake_magnitude", "focal_depth", "bathymetry", "coastal_elevation"],
    ),
    HazardType.HEATWAVE: (
        "Extreme Heat & Apparent Temperature Model",
        "Thermal stress, wet-bulb globe temperature, and heatwave duration predictor.",
        ["max_temperature", "min_temperature", "humidity", "apparent_temperature", "nighttime_temperature"],
    ),
}
