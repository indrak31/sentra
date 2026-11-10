"""Optimization service bridging DB inventory, OR-Tools solver, and allocation persistence."""

from datetime import datetime, timezone
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from app.core.exceptions import EntityNotFoundException
from app.models.allocation import Allocation, OptimizationRun
from app.models.resource import Resource
from app.optimization.solver import resource_optimizer
from app.schemas.optimization import (
    OptimizationRequest,
    OptimizationResponse,
    SupplyItem,
)


class OptimizationService:
    def run_optimization(self, db: Session, req: OptimizationRequest) -> OptimizationResponse:
        # If supplies are not explicitly provided in the request, load active resources from the database
        resolved_supplies = req.supplies
        if resolved_supplies is None:
            query = db.query(Resource).filter(
                Resource.operational_status == "OPERATIONAL",
                Resource.available_capacity > 0,
            )
            if req.district_id:
                query = query.filter(Resource.district_id == req.district_id)

            db_resources = query.all()
            resolved_supplies = [
                SupplyItem(
                    resource_id=r.id,
                    name=r.name,
                    resource_type=r.resource_type,
                    available_quantity=r.available_capacity,
                    district_id=r.district_id,
                )
                for r in db_resources
            ]
            req.supplies = resolved_supplies

        # Execute OR-Tools solver
        result: OptimizationResponse = resource_optimizer.solve(req)
        completed_at = datetime.now(timezone.utc)
        result.completed_at = completed_at

        # Persist optimization run snapshot and status (proposals only; does not mutate live inventory)
        opt_run = OptimizationRun(
            id=result.run_id,
            district_id=req.district_id,
            status=result.status,
            solver_status=result.solver_status,
            objective_value=result.objective_value,
            input_snapshot={
                "objective": req.objective.value,
                "demands": [d.model_dump() for d in req.demands],
                "supplies": [s.model_dump() for s in (req.supplies or [])],
                "max_travel_time_minutes": req.max_travel_time_minutes,
            },
            result_summary=result.result_summary,
            unmet_demand=result.unmet_demand,
            unused_capacity=result.unused_capacity,
            completed_at=completed_at,
        )
        db.add(opt_run)

        # Persist proposed allocations
        for alloc in result.allocations:
            db_alloc = Allocation(
                optimization_run_id=opt_run.id,
                resource_id=alloc.resource_id,
                district_id=alloc.demand_id,
                allocated_quantity=alloc.allocated_quantity,
                status="PROPOSED",
                notes=f"Proposed allocation for {alloc.resource_name} ({alloc.resource_type})",
            )
            db.add(db_alloc)

        db.commit()
        return result

    def get_run(self, db: Session, run_id: str) -> OptimizationRun:
        run = db.query(OptimizationRun).filter(OptimizationRun.id == run_id).first()
        if not run:
            raise EntityNotFoundException("OptimizationRun", run_id)
        return run

    def list_runs(
        self, db: Session, district_id: Optional[str] = None, page: int = 1, page_size: int = 20
    ) -> Tuple[List[OptimizationRun], int]:
        query = db.query(OptimizationRun)
        if district_id:
            query = query.filter(OptimizationRun.district_id == district_id)
        total = query.count()
        offset = (page - 1) * page_size
        items = query.order_by(OptimizationRun.created_at.desc()).offset(offset).limit(page_size).all()
        return items, total

    def list_allocations(self, db: Session, run_id: str) -> List[Allocation]:
        self.get_run(db, run_id)
        return db.query(Allocation).filter(Allocation.optimization_run_id == run_id).all()


optimization_service = OptimizationService()
