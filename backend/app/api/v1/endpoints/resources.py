"""Emergency resource inventory management endpoints."""

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
from app.models.resource import Resource
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.resource import ResourceCreate, ResourceRead, ResourceUpdate
from app.services.resource_service import resource_service

router = APIRouter(tags=["Resources"])


@router.post("/resources", response_model=ResourceRead, status_code=status.HTTP_201_CREATED)
def create_resource(
    req: ResourceCreate,
    current_user: Annotated[User, Depends(require_permission(Permission.MANAGE_RESOURCES))],
    db: Annotated[Session, Depends(get_db)],
) -> Resource:
    """Register a new emergency resource inventory item."""
    verify_user_geographic_scope(current_user, target_district_id=req.district_id)
    return resource_service.create(db, req)


@router.get("/resources", response_model=PaginatedResponse[ResourceRead])
def list_resources(
    current_user: Annotated[User, Depends(require_permission(Permission.READ_RESOURCES))],
    db: Annotated[Session, Depends(get_db)],
    district_id: Optional[str] = Query(None),
    resource_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
) -> PaginatedResponse[ResourceRead]:
    """List resources with optional filtering."""
    if district_id:
        verify_user_geographic_scope(current_user, target_district_id=district_id)

    items, total = resource_service.list_resources(
        db, district_id=district_id, resource_type=resource_type, status=status, page=page, page_size=page_size
    )
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        pages=ceil(total / page_size) if total > 0 else 1,
    )


@router.get("/resources/{resource_id}", response_model=ResourceRead)
def get_resource(
    resource_id: str,
    current_user: Annotated[User, Depends(require_permission(Permission.READ_RESOURCES))],
    db: Annotated[Session, Depends(get_db)],
) -> Resource:
    """Retrieve details for a specific resource."""
    res = resource_service.get_by_id(db, resource_id)
    verify_user_geographic_scope(current_user, target_district_id=res.district_id)
    return res


@router.patch("/resources/{resource_id}", response_model=ResourceRead)
def update_resource(
    resource_id: str,
    req: ResourceUpdate,
    current_user: Annotated[User, Depends(require_permission(Permission.UPDATE_RESOURCE_STATUS))],
    db: Annotated[Session, Depends(get_db)],
) -> Resource:
    """Update resource availability, operational capacity, or operational status."""
    res = resource_service.get_by_id(db, resource_id)
    verify_user_geographic_scope(current_user, target_district_id=res.district_id)
    return resource_service.update(db, resource_id, req)


@router.get(
    "/locations/districts/{district_id}/resources",
    response_model=PaginatedResponse[ResourceRead],
)
def list_district_resources(
    district_id: str,
    current_user: Annotated[User, Depends(require_permission(Permission.READ_RESOURCES))],
    db: Annotated[Session, Depends(get_db)],
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
) -> PaginatedResponse[ResourceRead]:
    """Retrieve all emergency resources located in a specific district."""
    verify_user_geographic_scope(current_user, target_district_id=district_id)
    items, total = resource_service.list_resources(
        db, district_id=district_id, page=page, page_size=page_size
    )
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        pages=ceil(total / page_size) if total > 0 else 1,
    )
