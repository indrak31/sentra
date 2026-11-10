"""Reporting and analytical aggregate endpoints."""

from typing import Annotated, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.api.deps import (
    get_db,
    require_permission,
    verify_user_geographic_scope,
)
from app.core.permissions import Permission
from app.models.user import User
from app.schemas.report import DisasterImpactReport, SystemSummaryReport
from app.services.report_service import report_service

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/summary", response_model=SystemSummaryReport)
def get_system_summary_report(
    _: Annotated[User, Depends(require_permission(Permission.READ_REPORTS))],
    db: Annotated[Session, Depends(get_db)],
) -> SystemSummaryReport:
    """Retrieve macro platform statistics across all Indian states and modules."""
    return report_service.get_system_summary(db)


@router.get("/disaster-impact", response_model=DisasterImpactReport)
def get_disaster_impact_report(
    current_user: Annotated[User, Depends(require_permission(Permission.READ_REPORTS))],
    db: Annotated[Session, Depends(get_db)],
    state_id: Optional[str] = Query(None),
) -> DisasterImpactReport:
    """Generate state-wise and district-level disaster risk, alert, and resource reports."""
    if state_id:
        verify_user_geographic_scope(current_user, target_state_id=state_id)
    return report_service.get_disaster_impact_report(db, state_id=state_id)
