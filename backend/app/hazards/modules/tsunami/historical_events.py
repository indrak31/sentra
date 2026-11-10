"""Verified historical tsunami events affecting the Indian coastline for scientific baseline reference."""

from typing import List
from app.hazards.base import HistoricalEvent
from app.schemas.risk_assessment import HazardType

VERIFIED_TSUNAMI_EVENTS: List[HistoricalEvent] = [
    HistoricalEvent(
        event_id="TS-HIST-2004-IO",
        event_name="Great Indian Ocean Boxing Day Tsunami",
        event_year=2004,
        hazard_type=HazardType.TSUNAMI,
        state_code="TN",
        state_name="Tamil Nadu / Andaman & Nicobar",
        district_name="Nagapattinam & Andaman Islands",
        start_date="2004-12-26",
        severity="CRITICAL",
        peak_metric_name="Maximum Coastal Wave Runup Height",
        peak_metric_value=12.5,
        peak_metric_unit="meters",
        estimated_exposed_population=2800000,
        reported_fatalities=16269,
        economic_loss_inr_cr=11500.0,
        description="A massive Mw 9.1-9.3 megathrust earthquake along the Sunda Trench triggered mega-tsunami waves propagating across the Bay of Bengal, inundating coastal Tamil Nadu, Andhra Pradesh, Kerala, and the Andaman & Nicobar archipelagos.",
        data_source="Indian National Centre for Ocean Information Services (INCOIS) / Survey of India Geodetic Branch Post-Tsunami Survey 2005",
    ),
    HistoricalEvent(
        event_id="TS-HIST-1945-MK",
        event_name="Makran Subduction Zone Arabian Sea Tsunami",
        event_year=1945,
        hazard_type=HazardType.TSUNAMI,
        state_code="GJ",
        state_name="Gujarat",
        district_name="Kutch & Saurashtra Coast",
        start_date="1945-11-28",
        severity="HIGH",
        peak_metric_name="Maximum Coastal Wave Runup Height",
        peak_metric_value=4.8,
        peak_metric_unit="meters",
        estimated_exposed_population=450000,
        reported_fatalities=4000,
        economic_loss_inr_cr=350.0,
        description="An 8.1 Mw subsea thrust earthquake along the Makran subduction trench generated tsunami waves that struck Pasni, Karachi, and the Gulf of Kutch and Mumbai harbours.",
        data_source="India Meteorological Department (IMD) Seismological Records / Current Science Vol. 91",
    ),
]

