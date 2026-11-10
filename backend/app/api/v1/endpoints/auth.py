"""Authentication API endpoints."""

from typing import Annotated, Optional
from fastapi import APIRouter, Body, Depends, Request, status
from sqlalchemy.orm import Session
from app.api.deps import get_current_user, get_db
from app.core.exceptions import AuthenticationError
from app.core.middleware import rate_limiter
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    PasswordChangeRequest,
    RefreshTokenRequest,
    RegisterRequest,
    TokenResponse,
)
from app.schemas.common import MessageResponse
from app.schemas.user import UserRead
from app.services.auth_service import auth_service

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register(
    req: RegisterRequest,
    db: Annotated[Session, Depends(get_db)],
) -> User:
    """Register a new user account with default baseline permissions."""
    return auth_service.register(db, req)


from fastapi.security import OAuth2PasswordRequestForm

@router.post("/login", response_model=TokenResponse)
def login(
    req: LoginRequest,
    request: Request,
    db: Annotated[Session, Depends(get_db)],
) -> TokenResponse:
    """Authenticate with email and password via JSON payload to receive JWT access + refresh tokens."""
    ip_address = request.client.host if request.client else "unknown"

    # Rate limiting on login attempts
    if not rate_limiter.is_allowed(f"login_{ip_address}", max_requests=15, window_seconds=60):
        raise AuthenticationError("Too many login attempts. Please wait a moment.", code="RATE_LIMITED")

    return auth_service.login(db, req, ip_address=ip_address)


@router.post("/token", response_model=TokenResponse, include_in_schema=True)
def login_for_access_token(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
) -> TokenResponse:
    """OAuth2 password form login endpoint for Swagger UI 'Authorize' button."""
    ip_address = request.client.host if request.client else "unknown"

    if not rate_limiter.is_allowed(f"login_{ip_address}", max_requests=15, window_seconds=60):
        raise AuthenticationError("Too many login attempts. Please wait a moment.", code="RATE_LIMITED")

    login_req = LoginRequest(email=form_data.username, password=form_data.password)
    return auth_service.login(db, login_req, ip_address=ip_address)


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(
    req: RefreshTokenRequest,
    db: Annotated[Session, Depends(get_db)],
) -> TokenResponse:
    """Rotate an opaque refresh token and obtain a fresh access token."""
    return auth_service.refresh_token(db, req.refresh_token)


@router.post("/logout", response_model=MessageResponse)
def logout(
    req: RefreshTokenRequest,
    db: Annotated[Session, Depends(get_db)],
) -> MessageResponse:
    """Revoke the active refresh session."""
    auth_service.logout(db, req.refresh_token)
    return MessageResponse(message="Successfully logged out and session revoked.")


@router.get("/me", response_model=UserRead)
def get_me(current_user: Annotated[User, Depends(get_current_user)]) -> User:
    """Retrieve details for the current authenticated user."""
    return current_user


@router.post("/change-password", response_model=MessageResponse)
def change_password(
    req: PasswordChangeRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> MessageResponse:
    """Change password and revoke all existing refresh sessions."""
    auth_service.change_password(db, current_user, req)
    return MessageResponse(message="Password successfully changed. Active sessions revoked.")
