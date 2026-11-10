"""Geospatial hazard service for computing scientific impact envelopes and GIS geometries."""

import math
from typing import Any, Dict, List, Optional
from app.schemas.risk_assessment import HazardType


class GeospatialHazardService:
    """Computes physical hazard impact envelopes, bounding buffers, and GIS risk centroids."""

    def compute_hazard_impact_envelope(
        self,
        hazard_type: HazardType,
        latitude: float,
        longitude: float,
        severity_level: str,
        primary_metric_value: Optional[float] = None,
    ) -> Dict[str, Any]:
        """Compute geographic impact envelope radius (in kilometers) based on physical properties."""
        if hazard_type == HazardType.EARTHQUAKE:
            # For earthquakes, impact radius depends on shaking threshold (PGA >= 0.05g)
            # R ≈ exp((ln(PGA) - c1 - c2*Mw)/-c3) or empirical approximation
            magnitude = primary_metric_value if primary_metric_value and primary_metric_value > 3.0 else 6.0
            radius_km = min(350.0, max(15.0, math.exp(0.85 * magnitude - 2.1)))
        elif hazard_type == HazardType.FLOOD:
            # Flood riverine corridor impact buffer
            discharge = primary_metric_value or 500.0
            radius_km = min(80.0, max(8.0, 12.0 * math.log10(max(10.0, discharge))))
        elif hazard_type == HazardType.DROUGHT:
            # Regional aridity footprint
            radius_km = 120.0 if severity_level in ["CRITICAL", "HIGH"] else 60.0
        elif hazard_type == HazardType.CYCLONE:
            radius_km = 180.0 if severity_level == "CRITICAL" else 100.0
        elif hazard_type == HazardType.TSUNAMI:
            radius_km = 45.0  # Coastal inundation runup strip
        else:
            radius_km = 30.0

        return {
            "hazard_type": hazard_type.value,
            "center": {"latitude": latitude, "longitude": longitude},
            "estimated_impact_radius_km": round(radius_km, 1),
            "severity_level": severity_level,
            "envelope_geometry_type": "CircularBuffer",
            "disclaimer": "Impact envelope represents estimated operational mobilization radius, not precise micro-topographic flood/fault extent.",
        }


geospatial_hazard_service = GeospatialHazardService()

