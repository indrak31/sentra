"""Reporting and analytical aggregate schemas."""

from typing import List, Optional
from pydantic import BaseModel


class SystemSummaryReport(BaseModel):
    total_states: int
    total_districts: int
    total_observations: int
    total_risk_assessments: int
    total_active_alerts: int
    total_registered_resources: int
    total_optimization_runs: int
    generated_at: str


class DistrictImpactSummary(BaseModel):
    district_id: str
    district_name: str
    state_name: str
    total_observations: int
    latest_hazard_assessment: Optional[str] = None
    latest_assessment_status: Optional[str] = None
    estimated_affected_population: Optional[int] = None
    active_alerts_count: int
    available_resources_count: int


class DisasterImpactReport(BaseModel):
    state_id: Optional[str] = None
    summary_by_district: List[DistrictImpactSummary]
    total_districts_reported: int
    generated_at: str
