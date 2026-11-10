"""User, Role, and Admin management schemas."""

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class RoleRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    description: Optional[str] = None


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: EmailStr
    full_name: str
    is_active: bool
    state_id: Optional[str] = None
    district_id: Optional[str] = None
    roles: List[RoleRead] = []
    created_at: datetime


class AdminUserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str = Field(..., min_length=2, max_length=100)
    roles: List[str] = Field(default_factory=list, description="List of role names e.g. ['DISASTER_MANAGER']")
    state_id: Optional[str] = None
    district_id: Optional[str] = None


class AdminUserUpdate(BaseModel):
    full_name: Optional[str] = None
    is_active: Optional[bool] = None
    roles: Optional[List[str]] = None
    state_id: Optional[str] = None
    district_id: Optional[str] = None


class AuditLogRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: Optional[str] = None
    action: str
    entity_type: str
    entity_id: Optional[str] = None
    details: Dict[str, Any]
    ip_address: Optional[str] = None
    timestamp: datetime
