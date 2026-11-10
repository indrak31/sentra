"""OR-Tools Emergency Resource Optimization Solver."""

import uuid
from typing import Dict, List, Tuple
from ortools.linear_solver import pywraplp
from app.core.exceptions import OptimizationError
from app.schemas.optimization import (
    OptimizationObjective,
    OptimizationRequest,
    OptimizationResponse,
    PlannedAllocation,
)


class EmergencyResourceOptimizer:
    """Mathematical optimization engine for allocating emergency resources using Google OR-Tools."""

    def solve(self, request: OptimizationRequest) -> OptimizationResponse:
        run_id = str(uuid.uuid4())
        demands = request.demands
        supplies = request.supplies or []

        if not demands:
            raise OptimizationError("At least one demand point must be specified.")

        if not supplies:
            # If no resources are available in the system, return FEASIBLE with zero allocations and 100% unmet demand
            unmet = {d.demand_id: d.quantity_demanded for d in demands}
            return OptimizationResponse(
                run_id=run_id,
                status="FEASIBLE",
                solver_status="NO_SUPPLY_AVAILABLE",
                objective_value=0.0,
                allocations=[],
                unmet_demand=unmet,
                unused_capacity={},
                result_summary={
                    "total_demanded": sum(d.quantity_demanded for d in demands),
                    "total_allocated": 0,
                    "total_unmet": sum(d.quantity_demanded for d in demands),
                    "notes": "No emergency resources were available to satisfy demands.",
                },
            )

        # Build travel time lookup: (demand_id, resource_id) -> travel_time
        travel_time_map: Dict[Tuple[str, str], float] = {}
        if request.travel_times:
            for item in request.travel_times:
                travel_time_map[(item.demand_id, item.resource_id)] = item.travel_time_minutes

        # Create MIP solver using SCIP (or CBC if SCIP unavailable)
        solver = pywraplp.Solver.CreateSolver("SCIP")
        if not solver:
            solver = pywraplp.Solver.CreateSolver("CBC")
        if not solver:
            raise OptimizationError("Could not initialize OR-Tools MIP solver backend.")

        # Decision Variables: x[i, j] = units of resource j allocated to demand i
        x = {}
        for d in demands:
            for s in supplies:
                # Incompatibility check: resource types must match
                if d.resource_type != s.resource_type:
                    continue

                # Travel time cutoff check
                tt = travel_time_map.get((d.demand_id, s.resource_id))
                if request.max_travel_time_minutes is not None and tt is not None:
                    if tt > request.max_travel_time_minutes:
                        continue

                var_name = f"x_{d.demand_id}_{s.resource_id}"
                # Upper bound cannot exceed demand or available supply
                ub = min(d.quantity_demanded, s.available_quantity)
                x[(d.demand_id, s.resource_id)] = solver.IntVar(0, ub, var_name)

        # Constraint 1: Supply capacity limits
        for s in supplies:
            relevant_vars = [
                x[(d.demand_id, s.resource_id)]
                for d in demands
                if (d.demand_id, s.resource_id) in x
            ]
            if relevant_vars:
                solver.Add(solver.Sum(relevant_vars) <= s.available_quantity)

        # Constraint 2: Demand limits
        for d in demands:
            relevant_vars = [
                x[(d.demand_id, s.resource_id)]
                for s in supplies
                if (d.demand_id, s.resource_id) in x
            ]
            if relevant_vars:
                solver.Add(solver.Sum(relevant_vars) <= d.quantity_demanded)

        # Objective Function formulation
        objective = solver.Objective()
        objective.SetMaximization()

        for d in demands:
            for s in supplies:
                if (d.demand_id, s.resource_id) in x:
                    # Base weight from demand priority
                    weight = d.priority_weight * 100.0

                    # Travel time adjustment if present (small penalty to prefer nearer resources)
                    tt = travel_time_map.get((d.demand_id, s.resource_id), 0.0)
                    if request.objective == OptimizationObjective.MINIMIZE_TRAVEL_TIME:
                        # Higher travel time decreases score
                        coeff = weight - (tt * 0.5)
                    else:
                        coeff = weight - (tt * 0.01)

                    objective.SetCoefficient(x[(d.demand_id, s.resource_id)], coeff)

        # Solve
        solver_result = solver.Solve()

        if solver_result == pywraplp.Solver.OPTIMAL:
            status_str = "OPTIMAL"
        elif solver_result == pywraplp.Solver.FEASIBLE:
            status_str = "FEASIBLE"
        elif solver_result == pywraplp.Solver.INFEASIBLE:
            return OptimizationResponse(
                run_id=run_id,
                status="INFEASIBLE",
                solver_status="INFEASIBLE",
                objective_value=None,
                allocations=[],
                unmet_demand={d.demand_id: d.quantity_demanded for d in demands},
                unused_capacity={s.resource_id: s.available_quantity for s in supplies},
                result_summary={"error": "The problem constraints could not be satisfied."},
            )
        else:
            return OptimizationResponse(
                run_id=run_id,
                status="FAILED",
                solver_status=f"SOLVER_STATUS_{solver_result}",
                objective_value=None,
                allocations=[],
                unmet_demand={d.demand_id: d.quantity_demanded for d in demands},
                unused_capacity={s.resource_id: s.available_quantity for s in supplies},
                result_summary={"error": "Solver terminated abnormally."},
            )

        # Extract allocations and metrics
        planned_allocations: List[PlannedAllocation] = []
        allocated_by_demand: Dict[str, int] = {d.demand_id: 0 for d in demands}
        allocated_by_supply: Dict[str, int] = {s.resource_id: 0 for s in supplies}

        for (d_id, s_id), var in x.items():
            val = int(round(var.solution_value()))
            if val > 0:
                s_obj = next(s for s in supplies if s.resource_id == s_id)
                planned_allocations.append(
                    PlannedAllocation(
                        demand_id=d_id,
                        resource_id=s_id,
                        resource_name=s_obj.name,
                        resource_type=s_obj.resource_type,
                        allocated_quantity=val,
                    )
                )
                allocated_by_demand[d_id] += val
                allocated_by_supply[s_id] += val

        unmet_demand = {
            d.demand_id: d.quantity_demanded - allocated_by_demand[d.demand_id]
            for d in demands
        }
        unused_capacity = {
            s.resource_id: s.available_quantity - allocated_by_supply[s.resource_id]
            for s in supplies
        }

        total_demanded = sum(d.quantity_demanded for d in demands)
        total_allocated = sum(allocated_by_demand.values())
        total_unmet = sum(unmet_demand.values())

        return OptimizationResponse(
            run_id=run_id,
            status=status_str,
            solver_status="OPTIMAL_SOLUTION_FOUND" if status_str == "OPTIMAL" else "FEASIBLE_SOLUTION_FOUND",
            objective_value=round(solver.Objective().Value(), 2),
            allocations=planned_allocations,
            unmet_demand=unmet_demand,
            unused_capacity=unused_capacity,
            result_summary={
                "total_demanded": total_demanded,
                "total_allocated": total_allocated,
                "total_unmet": total_unmet,
                "allocation_rate_pct": round((total_allocated / total_demanded * 100), 2) if total_demanded > 0 else 100.0,
                "num_planned_allocations": len(planned_allocations),
            },
        )


resource_optimizer = EmergencyResourceOptimizer()
