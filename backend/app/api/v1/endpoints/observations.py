"""Environmental observation ingestion endpoints."""

from datetime import datetime
from math import ceil
from typing import Annotated, List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.api.deps import (
    get_db,
    require_permission,
    verify_user_geographic_scope,
)
from app.core.permissions import Permission
from app.models.observation import Observation
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.observation import (
    ObservationBulkCreate,
    ObservationCreate,
    ObservationRead,
)
from app.services.observation_service import observation_service

router = APIRouter(prefix="/observations", tags=["Environmental Observations"])


@router.post("", response_model=ObservationRead, status_code=status.HTTP_201_CREATED)
def create_observation(
    req: ObservationCreate,
    current_user: Annotated[User, Depends(require_permission(Permission.SUBMIT_OBSERVATIONS))],
    db: Annotated[Session, Depends(get_db)],
) -> Observation:
    """Ingest a single environmental observation with provenance."""
    verify_user_geographic_scope(current_user, target_district_id=req.district_id)
    return observation_service.create(db, req)


@router.post("/bulk", response_model=List[ObservationRead], status_code=status.HTTP_201_CREATED)
def bulk_create_observations(
    req: ObservationBulkCreate,
    current_user: Annotated[User, Depends(require_permission(Permission.SUBMIT_OBSERVATIONS))],
    db: Annotated[Session, Depends(get_db)],
) -> List[Observation]:
    """Bulk ingest up to 500 validated environmental observations."""
    for obs in req.observations:
        verify_user_geographic_scope(current_user, target_district_id=obs.district_id)
    return observation_service.bulk_create(db, req)


@router.get("", response_model=PaginatedResponse[ObservationRead])
def list_observations(
    current_user: Annotated[User, Depends(require_permission(Permission.READ_OBSERVATIONS))],
    db: Annotated[Session, Depends(get_db)],
    district_id: Optional[str] = Query(None),
    observation_type: Optional[str] = Query(None),
    start_time: Optional[datetime] = Query(None),
    end_time: Optional[datetime] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
) -> PaginatedResponse[ObservationRead]:
    """Retrieve environmental observations with optional filters."""
    if district_id:
        verify_user_geographic_scope(current_user, target_district_id=district_id)

    items, total = observation_service.list_observations(
        db,
        district_id=district_id,
        observation_type=observation_type,
        start_time=start_time,
        end_time=end_time,
        page=page,
        page_size=page_size,
    )
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        pages=ceil(total / page_size) if total > 0 else 1,
    )


@router.get("/{observation_id}", response_model=ObservationRead)
def get_observation(
    observation_id: str,
    current_user: Annotated[User, Depends(require_permission(Permission.READ_OBSERVATIONS))],
    db: Annotated[Session, Depends(get_db)],
) -> Observation:
    """Retrieve an environmental observation by its unique identifier."""
    obs = observation_service.get_by_id(db, observation_id)
    verify_user_geographic_scope(current_user, target_district_id=obs.district_id)
    return obs
