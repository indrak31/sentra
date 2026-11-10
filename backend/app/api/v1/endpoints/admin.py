"""Administrative API endpoints for user role management and audit logs."""

from math import ceil
from typing import Annotated
from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, require_admin
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.user import AdminUserCreate, AdminUserUpdate, AuditLogRead, UserRead
from app.services.user_service import user_service

router = APIRouter(prefix="/admin", tags=["Administration"])


@router.get("/users", response_model=PaginatedResponse[UserRead])
def list_users(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_admin)],
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
) -> PaginatedResponse[UserRead]:
    """List system users with pagination (Administrator only)."""
    items, total = user_service.list_users(db, page=page, page_size=page_size)
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        pages=ceil(total / page_size) if total > 0 else 1,
    )


@router.post("/users", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def create_user_by_admin(
    request: Request,
    req: AdminUserCreate,
    current_admin: Annotated[User, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> User:
    """Create a user and assign privileged roles or geographic restrictions (Administrator only)."""
    ip_addr = request.client.host if request.client else None
    return user_service.create_admin_user(
        db, req, actor_id=current_admin.id, ip_address=ip_addr
    )


@router.patch("/users/{user_id}", response_model=UserRead)
def update_user_by_admin(
    user_id: str,
    req: AdminUserUpdate,
    request: Request,
    current_admin: Annotated[User, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> User:
    """Update roles, active status, or geographic bounds of a user (Administrator only)."""
    ip_addr = request.client.host if request.client else None
    return user_service.update_admin_user(
        db, user_id, req, actor_id=current_admin.id, ip_address=ip_addr
    )


@router.get("/audit-logs", response_model=PaginatedResponse[AuditLogRead])
def list_audit_logs(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_admin)],
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
) -> PaginatedResponse[AuditLogRead]:
    """Inspect system security and administrative audit logs (Administrator only)."""
    items, total = user_service.list_audit_logs(db, page=page, page_size=page_size)
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        pages=ceil(total / page_size) if total > 0 else 1,
    )
