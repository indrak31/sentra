"""Risk assessment endpoints."""

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
from app.models.risk_assessment import RiskAssessment
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.risk_assessment import RiskAssessmentCreate, RiskAssessmentRead
from app.services.risk_assessment_service import risk_assessment_service

router = APIRouter(tags=["Risk Assessments"])


@router.post("/risk-assessments", response_model=RiskAssessmentRead, status_code=status.HTTP_201_CREATED)
def request_risk_assessment(
    req: RiskAssessmentCreate,
    current_user: Annotated[User, Depends(require_permission(Permission.REQUEST_RISK_ASSESSMENT))],
    db: Annotated[Session, Depends(get_db)],
) -> RiskAssessment:
    """Request hazard prediction and risk assessment for a district."""
    verify_user_geographic_scope(current_user, target_district_id=req.district_id)
    return risk_assessment_service.request_assessment(db, req)


@router.get("/risk-assessments", response_model=PaginatedResponse[RiskAssessmentRead])
def list_risk_assessments(
    current_user: Annotated[User, Depends(require_permission(Permission.READ_RISK_ASSESSMENT))],
    db: Annotated[Session, Depends(get_db)],
    district_id: Optional[str] = Query(None),
    hazard_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
) -> PaginatedResponse[RiskAssessmentRead]:
    """List risk assessments with optional filters."""
    if district_id:
        verify_user_geographic_scope(current_user, target_district_id=district_id)

    items, total = risk_assessment_service.list_assessments(
        db, district_id=district_id, hazard_type=hazard_type, status=status, page=page, page_size=page_size
    )
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        pages=ceil(total / page_size) if total > 0 else 1,
    )


@router.get("/risk-assessments/{assessment_id}", response_model=RiskAssessmentRead)
def get_risk_assessment(
    assessment_id: str,
    current_user: Annotated[User, Depends(require_permission(Permission.READ_RISK_ASSESSMENT))],
    db: Annotated[Session, Depends(get_db)],
) -> RiskAssessment:
    """Retrieve a single risk assessment with its provenance."""
    assessment = risk_assessment_service.get_by_id(db, assessment_id)
    verify_user_geographic_scope(current_user, target_district_id=assessment.district_id)
    return assessment


@router.get(
    "/locations/districts/{district_id}/risk-assessments",
    response_model=PaginatedResponse[RiskAssessmentRead],
)
def get_district_risk_assessments(
    district_id: str,
    current_user: Annotated[User, Depends(require_permission(Permission.READ_RISK_ASSESSMENT))],
    db: Annotated[Session, Depends(get_db)],
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
) -> PaginatedResponse[RiskAssessmentRead]:
    """Retrieve risk assessments filtered by district ID."""
    verify_user_geographic_scope(current_user, target_district_id=district_id)
    items, total = risk_assessment_service.list_assessments(
        db, district_id=district_id, page=page, page_size=page_size
    )
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        pages=ceil(total / page_size) if total > 0 else 1,
    )
