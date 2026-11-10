"""User self-service API endpoints."""

from typing import Annotated
from fastapi import APIRouter, Depends
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.user import UserRead

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserRead)
def get_current_user_profile(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    """Retrieve the authenticated user's profile and roles."""
    return current_user
