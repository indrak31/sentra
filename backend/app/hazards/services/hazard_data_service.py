"""Hazard data service providing environmental observations snapshot and historical intelligence."""

from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session
from app.hazards.base import HistoricalEvent
from app.hazards.services.hazard_data_pack_loader import hazard_data_pack_loader
from app.hazards.services.hazard_registry import hazard_registry
from app.models.observation import Observation
from app.schemas.risk_assessment import HazardType


class HazardDataService:
    """Manages telemetry observation harvesting, historical baseline intelligence, and data provenance."""

    def assemble_district_telemetry(
        self,
        db: Session,
        district_id: str,
        limit: int = 30,
    ) -> Dict[str, Any]:
        """Harvest recent station observations for a district and format into a key-value snapshot."""
        recent_obs = (
            db.query(Observation)
            .filter(Observation.district_id == district_id)
            .order_by(Observation.timestamp.desc())
            .limit(limit)
            .all()
        )

        snapshot: Dict[str, Any] = {}
        for obs in recent_obs:
            if obs.observation_type not in snapshot:
                snapshot[obs.observation_type] = {
                    "value": obs.value,
                    "unit": obs.unit,
                    "timestamp": obs.timestamp.isoformat(),
                    "quality_flag": obs.quality_flag,
                }
        return snapshot

    def get_district_impact_baseline(self, district_name: str) -> Optional[Dict[str, Any]]:
        """Retrieve authentic 732-district impact and vulnerability baseline metrics."""
        impact_map = hazard_data_pack_loader.get_district_flood_impact_map()
        clean = district_name.strip().lower()
        return impact_map.get(clean)

    def get_historical_intelligence(
        self,
        hazard_type: Optional[HazardType] = None,
        state_code: Optional[str] = None,
        min_year: Optional[int] = None,
    ) -> List[HistoricalEvent]:
        """Query verified disaster benchmark events with optional hazard and geographic filters."""
        events = hazard_registry.get_historical_events(hazard_type)

        if state_code:
            events = [e for e in events if e.state_code.upper() == state_code.upper()]

        if min_year:
            events = [e for e in events if e.event_year >= min_year]

        return events


# Singleton instance
hazard_data_service = HazardDataService()

