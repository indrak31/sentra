"""Health-impact estimation endpoints."""

from math import ceil
from typing import Annotated, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.api.deps import (
    get_db,
    require_permission,
    verify_user_geographic_scope,
)
from app.core.permissions import Permission
from app.models.health_impact import HealthImpact
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.health_impact import (
    HealthImpactEstimateRequest,
    HealthImpactRead,
)
from app.services.health_impact_service import health_impact_service

router = APIRouter(prefix="/health-impacts", tags=["Health Impacts"])


@router.post("/estimate", response_model=HealthImpactRead, status_code=status.HTTP_201_CREATED)
def estimate_health_impact(
    req: HealthImpactEstimateRequest,
    current_user: Annotated[User, Depends(require_permission(Permission.ESTIMATE_HEALTH_IMPACT))],
    db: Annotated[Session, Depends(get_db)],
) -> HealthImpact:
    """Calculate transparent macro health impact, affected population, and medical demand."""
    verify_user_geographic_scope(current_user, target_district_id=req.district_id)
    return health_impact_service.estimate(db, req)


@router.get("", response_model=PaginatedResponse[HealthImpactRead])
def list_health_impacts(
    current_user: Annotated[User, Depends(require_permission(Permission.READ_HEALTH_IMPACT))],
    db: Annotated[Session, Depends(get_db)],
    district_id: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
) -> PaginatedResponse[HealthImpactRead]:
    """List historical health impact estimates."""
    if district_id:
        verify_user_geographic_scope(current_user, target_district_id=district_id)

    items, total = health_impact_service.list_impacts(
        db, district_id=district_id, page=page, page_size=page_size
    )
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        pages=ceil(total / page_size) if total > 0 else 1,
    )


@router.get("/{impact_id}", response_model=HealthImpactRead)
def get_health_impact(
    impact_id: str,
    current_user: Annotated[User, Depends(require_permission(Permission.READ_HEALTH_IMPACT))],
    db: Annotated[Session, Depends(get_db)],
) -> HealthImpact:
    """Retrieve details and assumptions of a specific health-impact estimation."""
    impact = health_impact_service.get_by_id(db, impact_id)
    verify_user_geographic_scope(current_user, target_district_id=impact.district_id)
    return impact
