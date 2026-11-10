"""Hazard readiness service providing auditability, benchmark evaluation, and deployment statuses."""

from typing import List, Optional
from app.core.exceptions import EntityNotFoundException
from app.hazards.base import HazardReadinessInfo
from app.hazards.services.hazard_registry import hazard_registry
from app.schemas.risk_assessment import HazardType


class HazardReadinessService:
    """Manages readiness reporting, benchmark metrics, and model governance."""

    def list_all_readiness(self) -> List[HazardReadinessInfo]:
        """Return readiness states for all seven hazard models."""
        return hazard_registry.get_readiness_statuses()

    def get_hazard_readiness(self, hazard_type: HazardType) -> HazardReadinessInfo:
        """Return readiness info for a specific hazard category."""
        module = hazard_registry.get_module(hazard_type)
        if not module:
            raise EntityNotFoundException("HazardModule", hazard_type.value)
        return module.readiness_info


hazard_readiness_service = HazardReadinessService()

