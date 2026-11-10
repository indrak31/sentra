"""Emergency alert management endpoints."""

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
from app.models.alert import Alert
from app.models.user import User
from app.schemas.alert import AlertCreate, AlertRead, AlertUpdate
from app.schemas.common import PaginatedResponse
from app.services.alert_service import alert_service

router = APIRouter(prefix="/alerts", tags=["Emergency Alerts"])


@router.post("", response_model=AlertRead, status_code=status.HTTP_201_CREATED)
def create_alert(
    req: AlertCreate,
    current_user: Annotated[User, Depends(require_permission(Permission.CREATE_ALERT))],
    db: Annotated[Session, Depends(get_db)],
) -> Alert:
    """Issue a verified emergency disaster alert for a district."""
    verify_user_geographic_scope(current_user, target_district_id=req.district_id)
    return alert_service.create_alert(db, req, user_id=current_user.id)


@router.get("", response_model=PaginatedResponse[AlertRead])
def list_alerts(
    current_user: Annotated[User, Depends(require_permission(Permission.READ_ALERTS))],
    db: Annotated[Session, Depends(get_db)],
    district_id: Optional[str] = Query(None),
    hazard_type: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
) -> PaginatedResponse[AlertRead]:
    """Retrieve disaster alerts with severity and status filters."""
    if district_id:
        verify_user_geographic_scope(current_user, target_district_id=district_id)

    items, total = alert_service.list_alerts(
        db, district_id=district_id, hazard_type=hazard_type, severity=severity, status=status, page=page, page_size=page_size
    )
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        pages=ceil(total / page_size) if total > 0 else 1,
    )


@router.get("/{alert_id}", response_model=AlertRead)
def get_alert(
    alert_id: str,
    current_user: Annotated[User, Depends(require_permission(Permission.READ_ALERTS))],
    db: Annotated[Session, Depends(get_db)],
) -> Alert:
    """Retrieve a single emergency alert."""
    alert = alert_service.get_by_id(db, alert_id)
    verify_user_geographic_scope(current_user, target_district_id=alert.district_id)
    return alert


@router.patch("/{alert_id}", response_model=AlertRead)
def update_alert(
    alert_id: str,
    req: AlertUpdate,
    current_user: Annotated[User, Depends(require_permission(Permission.UPDATE_ALERT))],
    db: Annotated[Session, Depends(get_db)],
) -> Alert:
    """Update or acknowledge an emergency alert."""
    alert = alert_service.get_by_id(db, alert_id)
    verify_user_geographic_scope(current_user, target_district_id=alert.district_id)
    return alert_service.update_alert(db, alert_id, req, user_id=current_user.id)
