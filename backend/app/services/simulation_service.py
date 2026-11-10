"""Emergency scenario simulation service."""

from typing import Any, Dict
from sqlalchemy.orm import Session
from app.core.exceptions import EntityNotFoundException
from app.models.allocation import OptimizationRun
from app.models.simulation import Simulation
from app.optimization.solver import resource_optimizer
from app.schemas.optimization import DemandItem, OptimizationObjective, OptimizationRequest, SupplyItem
from app.schemas.simulation import SimulationComparison, SimulationCreate


class SimulationService:
    def create_simulation(self, db: Session, req: SimulationCreate) -> Simulation:
        demands = req.demands or []
        supplies = req.supplies or []

        # If baseline run specified, pull demands and supplies from baseline snapshot
        baseline_run = None
        if req.baseline_run_id:
            baseline_run = db.query(OptimizationRun).filter(OptimizationRun.id == req.baseline_run_id).first()
            if not baseline_run:
                raise EntityNotFoundException("OptimizationRun", req.baseline_run_id)

            if not demands:
                raw_demands = baseline_run.input_snapshot.get("demands", [])
                demands = [DemandItem(**d) for d in raw_demands]
            if not supplies:
                raw_supplies = baseline_run.input_snapshot.get("supplies", [])
                supplies = [SupplyItem(**s) for s in raw_supplies]

        # Apply simulation multipliers
        simulated_demands = [
            DemandItem(
                demand_id=d.demand_id,
                name=d.name,
                resource_type=d.resource_type,
                quantity_demanded=max(1, int(round(d.quantity_demanded * req.demand_multiplier))),
                priority_weight=d.priority_weight,
            )
            for d in demands
        ]
        simulated_supplies = [
            SupplyItem(
                resource_id=s.resource_id,
                name=s.name,
                resource_type=s.resource_type,
                available_quantity=max(0, int(round(s.available_quantity * req.capacity_multiplier))),
                district_id=s.district_id,
            )
            for s in supplies
        ]

        opt_req = OptimizationRequest(
            objective=OptimizationObjective.MINIMIZE_UNMET_DEMAND,
            demands=simulated_demands,
            supplies=simulated_supplies,
        )

        # Run solver (does not modify live records)
        response = resource_optimizer.solve(opt_req)

        simulation = Simulation(
            name=req.name,
            description=req.description,
            baseline_run_id=req.baseline_run_id,
            scenario_parameters={
                "demand_multiplier": req.demand_multiplier,
                "capacity_multiplier": req.capacity_multiplier,
                "num_demands": len(simulated_demands),
                "num_supplies": len(simulated_supplies),
            },
            status="COMPLETED",
            result_summary=response.model_dump(mode="json"),
        )
        db.add(simulation)
        db.commit()
        db.refresh(simulation)
        return simulation

    def get_simulation(self, db: Session, simulation_id: str) -> Simulation:
        sim = db.query(Simulation).filter(Simulation.id == simulation_id).first()
        if not sim:
            raise EntityNotFoundException("Simulation", simulation_id)
        return sim

    def compare_simulation(self, db: Session, simulation_id: str) -> SimulationComparison:
        sim = self.get_simulation(db, simulation_id)
        sim_metrics = sim.result_summary.get("result_summary", {})

        baseline_metrics: Dict[str, Any] = {}
        if sim.baseline_run_id:
            baseline_run = db.query(OptimizationRun).filter(OptimizationRun.id == sim.baseline_run_id).first()
            if baseline_run:
                baseline_metrics = baseline_run.result_summary

        total_demanded_diff = sim_metrics.get("total_demanded", 0) - baseline_metrics.get("total_demanded", 0)
        total_allocated_diff = sim_metrics.get("total_allocated", 0) - baseline_metrics.get("total_allocated", 0)
        total_unmet_diff = sim_metrics.get("total_unmet", 0) - baseline_metrics.get("total_unmet", 0)

        differences = {
            "total_demanded_diff": total_demanded_diff,
            "total_allocated_diff": total_allocated_diff,
            "total_unmet_diff": total_unmet_diff,
            "allocation_rate_change_pct": round(
                sim_metrics.get("allocation_rate_pct", 0) - baseline_metrics.get("allocation_rate_pct", 0), 2
            ),
        }

        return SimulationComparison(
            simulation_id=sim.id,
            baseline_run_id=sim.baseline_run_id,
            baseline_metrics=baseline_metrics,
            simulation_metrics=sim_metrics,
            differences=differences,
        )


simulation_service = SimulationService()
