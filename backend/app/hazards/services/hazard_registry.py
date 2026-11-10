"""Central registry maintaining active implementations of all seven hazard modules."""

from typing import Dict, List, Optional
from app.hazards.base import BaseHazardModule, HazardReadinessInfo, HistoricalEvent
from app.hazards.modules.drought.module import DroughtHazardModule
from app.hazards.modules.earthquake.module import EarthquakeHazardModule
from app.hazards.modules.flood.module import FloodHazardModule
from app.hazards.modules.planned.planned_modules import (
    CyclonePlannedHazardModule,
    HeatwavePlannedHazardModule,
    LandslidePlannedHazardModule,
)
from app.hazards.modules.tsunami.module import TsunamiHazardModule
from app.schemas.risk_assessment import HazardType


class HazardRegistry:
    """Enterprise registry for hazard modules, readiness metadata, and historical records."""

    def __init__(self):
        self._modules: Dict[HazardType, BaseHazardModule] = {}
        self._initialize_modules()

    def _initialize_modules(self) -> None:
        """Register the 4 existing research modules and 3 future planned modules."""
        # 1. Flood (Operational Validated)
        self._modules[HazardType.FLOOD] = FloodHazardModule()
        # 2. Earthquake (Operational Validated)
        self._modules[HazardType.EARTHQUAKE] = EarthquakeHazardModule()
        # 3. Drought (Operational Validated)
        self._modules[HazardType.DROUGHT] = DroughtHazardModule()
        # 4. Tsunami (Operational Validated - NOAA Calibrated)
        self._modules[HazardType.TSUNAMI] = TsunamiHazardModule()
        # 5. Cyclone (Planned)
        self._modules[HazardType.CYCLONE] = CyclonePlannedHazardModule()
        # 6. Landslide (Planned)
        self._modules[HazardType.LANDSLIDE] = LandslidePlannedHazardModule()
        # 7. Heatwave (Planned)
        self._modules[HazardType.HEATWAVE] = HeatwavePlannedHazardModule()

    def get_module(self, hazard_type: HazardType) -> Optional[BaseHazardModule]:
        """Retrieve module instance by hazard category."""
        return self._modules.get(hazard_type)

    def list_all_modules(self) -> List[BaseHazardModule]:
        """Return list of all registered hazard modules."""
        return list(self._modules.values())

    def get_readiness_statuses(self) -> List[HazardReadinessInfo]:
        """Return readiness metadata for all 7 hazard modules."""
        return [mod.readiness_info for mod in self._modules.values()]

    def get_historical_events(self, hazard_type: Optional[HazardType] = None) -> List[HistoricalEvent]:
        """Return verified historical events across all or a specific hazard category."""
        if hazard_type:
            mod = self._modules.get(hazard_type)
            return mod.historical_events if mod else []

        all_events = []
        for mod in self._modules.values():
            all_events.extend(mod.historical_events)
        # Sort by event year descending
        all_events.sort(key=lambda e: e.event_year, reverse=True)
        return all_events


# System singleton
hazard_registry = HazardRegistry()

