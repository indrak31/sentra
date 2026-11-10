"""Geographic reference data endpoints."""

from typing import Annotated, List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.api.deps import get_current_user, get_db, require_permission
from app.core.permissions import Permission
from app.models.location import District, Location, State
from app.models.user import User
from app.schemas.location import (
    DistrictCreate,
    DistrictRead,
    LocationCreate,
    LocationRead,
    StateCreate,
    StateRead,
)
from app.services.location_service import location_service

router = APIRouter(prefix="/locations", tags=["Geography"])


@router.get("/states", response_model=List[StateRead])
def list_states(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(get_current_user)],
) -> List[State]:
    """List all supported Indian states and union territories."""
    return location_service.list_states(db)


@router.post("/states", response_model=StateRead, status_code=status.HTTP_201_CREATED)
def create_state(
    req: StateCreate,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_permission(Permission.MANAGE_REFERENCE_DATA))],
) -> State:
    """Register a new State or Union Territory (Authorized admin)."""
    return location_service.create_state(db, req)


@router.get("/states/{state_id}/districts", response_model=List[DistrictRead])
def list_districts_in_state(
    state_id: str,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(get_current_user)],
) -> List[District]:
    """List all districts belonging to a specific state."""
    return location_service.list_districts(db, state_id=state_id)


@router.get("/districts/{district_id}", response_model=DistrictRead)
def get_district(
    district_id: str,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(get_current_user)],
) -> District:
    """Retrieve details for a specific district."""
    return location_service.get_district(db, district_id)


@router.post("/districts", response_model=DistrictRead, status_code=status.HTTP_201_CREATED)
def create_district(
    req: DistrictCreate,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_permission(Permission.MANAGE_REFERENCE_DATA))],
) -> District:
    """Add a new district to a registered state."""
    return location_service.create_district(db, req)


@router.get("", response_model=List[LocationRead])
def list_locations(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(get_current_user)],
    district_id: Optional[str] = Query(None),
) -> List[Location]:
    """List specific emergency or observation locations/facilities."""
    return location_service.list_locations(db, district_id=district_id)


@router.post("", response_model=LocationRead, status_code=status.HTTP_201_CREATED)
def create_location(
    req: LocationCreate,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_permission(Permission.MANAGE_REFERENCE_DATA))],
) -> Location:
    """Register a specific facility, hospital, shelter, or station."""
    return location_service.create_location(db, req)
