"""Simulation schemas for scenario modeling."""

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.optimization import DemandItem, SupplyItem


class SimulationCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    description: Optional[str] = None
    baseline_run_id: Optional[str] = None
    demand_multiplier: float = Field(1.0, gt=0.0, le=10.0, description="Multiplier for demand (e.g. 1.5 for +50% demand)")
    capacity_multiplier: float = Field(1.0, gt=0.0, le=2.0, description="Multiplier for supply capacity (e.g. 0.8 for -20% capacity)")
    demands: Optional[List[DemandItem]] = None
    supplies: Optional[List[SupplyItem]] = None


class SimulationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    description: Optional[str] = None
    baseline_run_id: Optional[str] = None
    scenario_parameters: Dict[str, Any]
    status: str
    result_summary: Dict[str, Any]
    created_at: datetime


class SimulationComparison(BaseModel):
    simulation_id: str
    baseline_run_id: Optional[str] = None
    baseline_metrics: Dict[str, Any]
    simulation_metrics: Dict[str, Any]
    differences: Dict[str, Any]
