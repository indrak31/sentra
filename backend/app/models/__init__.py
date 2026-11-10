"""SQLAlchemy models registry for SENTRA."""

from app.db.base import Base
from app.models.role import Role, user_roles
from app.models.user import User, RefreshSession
from app.models.location import State, District, Location
from app.models.observation import Observation
from app.models.risk_assessment import RiskAssessment
from app.models.health_impact import HealthImpact
from app.models.resource import Resource
from app.models.allocation import OptimizationRun, Allocation
from app.models.simulation import Simulation
from app.models.alert import Alert
from app.models.audit_log import AuditLog

__all__ = [
    "Base",
    "Role",
    "user_roles",
    "User",
    "RefreshSession",
    "State",
    "District",
    "Location",
    "Observation",
    "RiskAssessment",
    "HealthImpact",
    "Resource",
    "OptimizationRun",
    "Allocation",
    "Simulation",
    "Alert",
    "AuditLog",
]
