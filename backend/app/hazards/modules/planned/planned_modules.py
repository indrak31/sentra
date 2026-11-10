"""Future planned hazard research modules preserving explicit scientific research status."""

from typing import Any, Dict, List
from app.core.exceptions import ModelUnavailableException
from app.hazards.base import BaseHazardModule, EvaluationMetric, HazardPredictionOutput, HazardReadinessInfo, HistoricalEvent
from app.hazards.services.hazard_data_pack_loader import hazard_data_pack_loader
from app.schemas.risk_assessment import HazardType


class CyclonePlannedHazardModule(BaseHazardModule):
    """Tropical Cyclone hazard module scheduled for subsequent research integration."""

    @property
    def hazard_type(self) -> HazardType:
        return HazardType.CYCLONE

    @property
    def readiness_info(self) -> HazardReadinessInfo:
        return HazardReadinessInfo(
            hazard_type=HazardType.CYCLONE,
            model_name="SENTRA Vortex-Track & SLOSH Coastal Storm Surge Predictor",
            model_version="0.1.0-planned",
            is_available=False,
            readiness_status="PLANNED_RESEARCH",
            scientific_methodology="Holland B atmospheric parametric vortex model coupled with Sea, Lake, and Overland Surges from Hurricanes (SLOSH) hydrodynamic grid",
            expected_inputs=[
                "storm_position",
                "wind_speed",
                "atmospheric_pressure",
                "forecast_track",
                "coastal_exposure",
            ],
            input_units={
                "storm_position": "coordinates (lat, lng)",
                "wind_speed": "knots / kmph",
                "atmospheric_pressure": "hPa / mbar",
                "forecast_track": "temporal track waypoints",
                "coastal_exposure": "bathymetric profile index",
            },
            blocker_reason="Awaiting Doppler Weather Radar (DWR) real-time radial velocity streaming pipeline from IMD Cyclone Warning Division.",
            provenance_reference="IMD Cyclone e-Atlas & Regional Specialized Meteorological Centre (RSMC) New Delhi",
        )

    @property
    def historical_events(self) -> List[HistoricalEvent]:
        ibtracs_events = hazard_data_pack_loader.load_cyclone_events(limit=30)
        baseline_landmarks = [
            HistoricalEvent(
                event_id="CY-HIST-1999-OD",
                event_name="1999 Odisha Super Cyclone (05B)",
                event_year=1999,
                hazard_type=HazardType.CYCLONE,
                state_code="OD",
                state_name="Odisha",
                district_name="Jagatsinghpur (Paradip)",
                start_date="1999-10-29",
                severity="CRITICAL",
                peak_metric_name="Sustained Maximum Wind Speed",
                peak_metric_value=260.0,
                peak_metric_unit="km/h",
                estimated_exposed_population=12500000,
                reported_fatalities=9887,
                economic_loss_inr_cr=25000.0,
                description="Category 5 equivalent super cyclone with minimum central pressure of 912 hPa caused a 6-7 meter storm surge penetrating up to 35 km inland.",
                data_source="India Meteorological Department (IMD) Technical Report No. 1999/1",
            ),
            HistoricalEvent(
                event_id="CY-HIST-2019-OD",
                event_name="Extremely Severe Cyclonic Storm Fani",
                event_year=2019,
                hazard_type=HazardType.CYCLONE,
                state_code="OD",
                state_name="Odisha",
                district_name="Puri",
                start_date="2019-05-03",
                severity="CRITICAL",
                peak_metric_name="Peak Gust Wind Speed",
                peak_metric_value=215.0,
                peak_metric_unit="km/h",
                estimated_exposed_population=16000000,
                reported_fatalities=89,
                economic_loss_inr_cr=24000.0,
                description="Massive pre-monsoon cyclone made landfall near Puri; timely evacuation of 1.2 million citizens to multipurpose cyclone shelters limited loss of life.",
                data_source="Odisha State Disaster Management Authority (OSDMA) Post-Fani Recovery Assessment",
            ),
        ]
        return baseline_landmarks + list(ibtracs_events)

    def validate_features(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        return input_data

    def compute_risk(self, validated_features: Dict[str, Any]) -> HazardPredictionOutput:
        raise ModelUnavailableException(
            hazard_type="CYCLONE",
            details="The predictive model for CYCLONE is under PLANNED_RESEARCH status. Real-time radar assimilation pipeline is currently uncoupled.",
        )


class LandslidePlannedHazardModule(BaseHazardModule):
    """Slope Landslide hazard module scheduled for subsequent research integration."""

    @property
    def hazard_type(self) -> HazardType:
        return HazardType.LANDSLIDE

    @property
    def readiness_info(self) -> HazardReadinessInfo:
        return HazardReadinessInfo(
            hazard_type=HazardType.LANDSLIDE,
            model_name="SENTRA Geotechnical Slope Stability & Rainfall Threshold Engine",
            model_version="0.1.0-planned",
            is_available=False,
            readiness_status="PLANNED_RESEARCH",
            scientific_methodology="Infinite slope stability model with transient pore-water pressure infiltration coupled with Caine rainfall intensity-duration thresholds",
            expected_inputs=[
                "rainfall",
                "slope",
                "terrain",
                "soil_characteristics",
                "land_cover",
                "previous_landslides",
            ],
            input_units={
                "rainfall": "mm/24h",
                "slope": "degrees",
                "terrain": "DEM elevation m",
                "soil_characteristics": "cohesion & internal friction angle",
                "land_cover": "NDVI / canopy coverage",
                "previous_landslides": "historical count",
            },
            blocker_reason="Awaiting Geological Survey of India (GSI) 1:10,000 high-resolution landslide susceptibility spatial geodatabase coupling.",
            provenance_reference="Geological Survey of India (GSI) National Landslide Susceptibility Mapping (NLSM) Programme",
        )

    @property
    def historical_events(self) -> List[HistoricalEvent]:
        return [
            HistoricalEvent(
                event_id="LS-HIST-2024-KL",
                event_name="Wayanad Severe Hillside Debris Flow",
                event_year=2024,
                hazard_type=HazardType.LANDSLIDE,
                state_code="KL",
                state_name="Kerala",
                district_name="Wayanad (Chooralmala & Meppadi)",
                start_date="2024-07-30",
                severity="CRITICAL",
                peak_metric_name="Antecedent 48-Hour Precipitation",
                peak_metric_value=572.0,
                peak_metric_unit="mm",
                estimated_exposed_population=8500,
                reported_fatalities=420,
                economic_loss_inr_cr=1200.0,
                description="Extreme orographic rainfall triggered catastrophic multi-phase debris flow traveling 8 km down the Iruvaipuzha river course, pulverizing hillside settlements.",
                data_source="National Centre for Earth Science Studies (NCESS) / Geological Survey of India Preliminary Geotechnical Report",
            ),
        ]

    def validate_features(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        return input_data

    def compute_risk(self, validated_features: Dict[str, Any]) -> HazardPredictionOutput:
        raise ModelUnavailableException(
            hazard_type="LANDSLIDE",
            details="The predictive model for LANDSLIDE is under PLANNED_RESEARCH status. GSI slope inventory integration is scheduled for Phase 2.",
        )


class HeatwavePlannedHazardModule(BaseHazardModule):
    """Extreme Heat & Apparent Temperature hazard module scheduled for subsequent research integration."""

    @property
    def hazard_type(self) -> HazardType:
        return HazardType.HEATWAVE

    @property
    def readiness_info(self) -> HazardReadinessInfo:
        return HazardReadinessInfo(
            hazard_type=HazardType.HEATWAVE,
            model_name="SENTRA Thermal Stress & Wet-Bulb Globe Temperature Index",
            model_version="0.1.0-planned",
            is_available=False,
            readiness_status="PLANNED_RESEARCH",
            scientific_methodology="Steadman Apparent Temperature algorithm and Liljegren Wet-Bulb Globe Temperature (WBGT) occupational heat stress index",
            expected_inputs=[
                "max_temperature",
                "min_temperature",
                "humidity",
                "apparent_temperature",
                "nighttime_temperature",
            ],
            input_units={
                "max_temperature": "deg C",
                "min_temperature": "deg C",
                "humidity": "% RH",
                "apparent_temperature": "deg C",
                "nighttime_temperature": "deg C",
            },
            blocker_reason="Awaiting gridded AWS daily temperature anomaly reanalysis feeds from National Climate Centre (NCC) Pune.",
            provenance_reference="India Meteorological Department (IMD) Guidelines for Heatwave Action Plans (HAP) & NDMA",
        )

    @property
    def historical_events(self) -> List[HistoricalEvent]:
        return [
            HistoricalEvent(
                event_id="HW-HIST-2022-IN",
                event_name="2022 Pre-Monsoon Extreme Northern Plains Heatwave",
                event_year=2022,
                hazard_type=HazardType.HEATWAVE,
                state_code="DL",
                state_name="Delhi / UP / Rajasthan",
                district_name="National Capital Region",
                start_date="2022-03-28",
                severity="HIGH",
                peak_metric_name="Maximum Ambient Air Temperature",
                peak_metric_value=49.2,
                peak_metric_unit="deg C",
                estimated_exposed_population=45000000,
                reported_fatalities=90,
                economic_loss_inr_cr=3500.0,
                description="Earliest and hottest heatwave recorded in Northwest and Central India since 1901, severely damaging the standing rabi wheat harvest across Punjab and Haryana.",
                data_source="India Meteorological Department (IMD) Climate Diagnostic Bulletin / World Weather Attribution Study",
            ),
        ]

    def validate_features(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        return input_data

    def compute_risk(self, validated_features: Dict[str, Any]) -> HazardPredictionOutput:
        raise ModelUnavailableException(
            hazard_type="HEATWAVE",
            details="The predictive model for HEATWAVE is under PLANNED_RESEARCH status. Urban heat-island gridded reanalysis is scheduled for subsequent phase.",
        )

