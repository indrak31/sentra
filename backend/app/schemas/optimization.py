"""OR-Tools emergency resource optimization schemas."""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class OptimizationObjective(str, Enum):
    MINIMIZE_UNMET_DEMAND = "MINIMIZE_UNMET_DEMAND"
    PRIORITIZE_VULNERABLE = "PRIORITIZE_VULNERABLE"
    MINIMIZE_TRAVEL_TIME = "MINIMIZE_TRAVEL_TIME"


class DemandItem(BaseModel):
    demand_id: str = Field(..., description="Unique demand point identifier (e.g. district or ward id)")
    name: str = Field(..., description="Descriptive name of demand zone")
    resource_type: str = Field(..., description="Required resource type e.g. AMBULANCE, HOSPITAL_BED")
    quantity_demanded: int = Field(..., gt=0)
    priority_weight: float = Field(1.0, ge=0.1, le=10.0, description="Priority multiplier (higher = more urgent)")


class SupplyItem(BaseModel):
    resource_id: str = Field(..., description="ID of the resource inventory record")
    name: str
    resource_type: str
    available_quantity: int = Field(..., ge=0)
    district_id: Optional[str] = None


class TravelTimeItem(BaseModel):
    demand_id: str
    resource_id: str
    travel_time_minutes: float = Field(..., ge=0.0)


class OptimizationRequest(BaseModel):
    district_id: Optional[str] = Field(None, description="Optional target district scope")
    objective: OptimizationObjective = OptimizationObjective.MINIMIZE_UNMET_DEMAND
    demands: List[DemandItem] = Field(..., min_length=1, description="List of emergency demand points")
    supplies: Optional[List[SupplyItem]] = Field(
        None,
        description="Explicit supply items for testing/simulation. If omitted, available DB resources are automatically queried.",
    )
    travel_times: Optional[List[TravelTimeItem]] = Field(
        None,
        description="Explicit travel times between demands and supplies where available",
    )
    max_travel_time_minutes: Optional[float] = Field(
        None,
        gt=0,
        description="Maximum permissible travel time cutoff constraint",
    )


class PlannedAllocation(BaseModel):
    demand_id: str
    resource_id: str
    resource_name: str
    resource_type: str
    allocated_quantity: int


class OptimizationResponse(BaseModel):
    run_id: str
    status: str = Field(..., description="OPTIMAL, FEASIBLE, INFEASIBLE, INVALID_INPUT, FAILED")
    solver_status: str
    objective_value: Optional[float] = None
    allocations: List[PlannedAllocation] = []
    unmet_demand: Dict[str, int] = {}
    unused_capacity: Dict[str, int] = {}
    result_summary: Dict[str, Any] = {}
    completed_at: Optional[datetime] = None


class AllocationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    optimization_run_id: Optional[str] = None
    resource_id: str
    district_id: str
    allocated_quantity: int
    status: str
    notes: Optional[str] = None
    created_at: datetime
