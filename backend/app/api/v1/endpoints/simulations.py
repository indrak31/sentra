"""Emergency scenario simulation endpoints."""

from typing import Annotated
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, require_permission
from app.core.permissions import Permission
from app.models.simulation import Simulation
from app.models.user import User
from app.schemas.simulation import (
    SimulationComparison,
    SimulationCreate,
    SimulationRead,
)
from app.services.simulation_service import simulation_service

router = APIRouter(prefix="/simulations", tags=["Simulations"])


@router.post("", response_model=SimulationRead, status_code=status.HTTP_201_CREATED)
def create_simulation(
    req: SimulationCreate,
    _: Annotated[User, Depends(require_permission(Permission.RUN_SIMULATION))],
    db: Annotated[Session, Depends(get_db)],
) -> Simulation:
    """Run an isolated what-if emergency scenario simulation without affecting live operational data."""
    return simulation_service.create_simulation(db, req)


@router.get("/{simulation_id}", response_model=SimulationRead)
def get_simulation(
    simulation_id: str,
    _: Annotated[User, Depends(require_permission(Permission.READ_SIMULATION))],
    db: Annotated[Session, Depends(get_db)],
) -> Simulation:
    """Retrieve parameters and results of a scenario simulation."""
    return simulation_service.get_simulation(db, simulation_id)


@router.get("/{simulation_id}/compare", response_model=SimulationComparison)
def compare_simulation(
    simulation_id: str,
    _: Annotated[User, Depends(require_permission(Permission.READ_SIMULATION))],
    db: Annotated[Session, Depends(get_db)],
) -> SimulationComparison:
    """Compare a scenario simulation against baseline operational data."""
    return simulation_service.compare_simulation(db, simulation_id)
