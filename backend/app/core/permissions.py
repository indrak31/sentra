"""Role-Based Access Control (RBAC) and Geographic Scope enforcement."""

from enum import Enum
from typing import List, Optional, Set
from app.core.exceptions import GeographicScopeError


class RoleName(str, Enum):
    ADMINISTRATOR = "ADMINISTRATOR"
    DISASTER_MANAGER = "DISASTER_MANAGER"
    HEALTHCARE_COORDINATOR = "HEALTHCARE_COORDINATOR"
    FIELD_RESPONDER = "FIELD_RESPONDER"
    ANALYST = "ANALYST"


class Permission(str, Enum):
    # Administrative
    MANAGE_USERS = "manage_users"
    VIEW_AUDIT_LOGS = "view_audit_logs"
    MANAGE_REFERENCE_DATA = "manage_reference_data"
    VIEW_SYSTEM_HEALTH = "view_system_health"

    # Observations
    SUBMIT_OBSERVATIONS = "submit_observations"
    READ_OBSERVATIONS = "read_observations"

    # Risk Assessment
    REQUEST_RISK_ASSESSMENT = "request_risk_assessment"
    READ_RISK_ASSESSMENT = "read_risk_assessment"

    # Health Impacts
    ESTIMATE_HEALTH_IMPACT = "estimate_health_impact"
    READ_HEALTH_IMPACT = "read_health_impact"

    # Resources
    MANAGE_RESOURCES = "manage_resources"
    READ_RESOURCES = "read_resources"
    UPDATE_RESOURCE_STATUS = "update_resource_status"

    # Optimization
    RUN_OPTIMIZATION = "run_optimization"
    READ_OPTIMIZATION = "read_optimization"
    CONFIRM_ALLOCATION = "confirm_allocation"

    # Simulations
    RUN_SIMULATION = "run_simulation"
    READ_SIMULATION = "read_simulation"

    # Alerts
    CREATE_ALERT = "create_alert"
    UPDATE_ALERT = "update_alert"
    READ_ALERTS = "read_alerts"

    # Reports
    READ_REPORTS = "read_reports"


# Mapping of roles to granted permissions
ROLE_PERMISSIONS: dict[RoleName, Set[Permission]] = {
    RoleName.ADMINISTRATOR: {
        Permission.MANAGE_USERS,
        Permission.VIEW_AUDIT_LOGS,
        Permission.MANAGE_REFERENCE_DATA,
        Permission.VIEW_SYSTEM_HEALTH,
        Permission.SUBMIT_OBSERVATIONS,
        Permission.READ_OBSERVATIONS,
        Permission.REQUEST_RISK_ASSESSMENT,
        Permission.READ_RISK_ASSESSMENT,
        Permission.ESTIMATE_HEALTH_IMPACT,
        Permission.READ_HEALTH_IMPACT,
        Permission.MANAGE_RESOURCES,
        Permission.READ_RESOURCES,
        Permission.UPDATE_RESOURCE_STATUS,
        Permission.RUN_OPTIMIZATION,
        Permission.READ_OPTIMIZATION,
        Permission.CONFIRM_ALLOCATION,
        Permission.RUN_SIMULATION,
        Permission.READ_SIMULATION,
        Permission.CREATE_ALERT,
        Permission.UPDATE_ALERT,
        Permission.READ_ALERTS,
        Permission.READ_REPORTS,
    },
    RoleName.DISASTER_MANAGER: {
        Permission.READ_OBSERVATIONS,
        Permission.REQUEST_RISK_ASSESSMENT,
        Permission.READ_RISK_ASSESSMENT,
        Permission.ESTIMATE_HEALTH_IMPACT,
        Permission.READ_HEALTH_IMPACT,
        Permission.READ_RESOURCES,
        Permission.RUN_OPTIMIZATION,
        Permission.READ_OPTIMIZATION,
        Permission.CONFIRM_ALLOCATION,
        Permission.RUN_SIMULATION,
        Permission.READ_SIMULATION,
        Permission.CREATE_ALERT,
        Permission.UPDATE_ALERT,
        Permission.READ_ALERTS,
        Permission.READ_REPORTS,
    },
    RoleName.HEALTHCARE_COORDINATOR: {
        Permission.READ_OBSERVATIONS,
        Permission.READ_RISK_ASSESSMENT,
        Permission.ESTIMATE_HEALTH_IMPACT,
        Permission.READ_HEALTH_IMPACT,
        Permission.READ_RESOURCES,
        Permission.UPDATE_RESOURCE_STATUS,
        Permission.READ_OPTIMIZATION,
        Permission.READ_ALERTS,
        Permission.READ_REPORTS,
    },
    RoleName.FIELD_RESPONDER: {
        Permission.READ_OBSERVATIONS,
        Permission.READ_RISK_ASSESSMENT,
        Permission.READ_RESOURCES,
        Permission.UPDATE_RESOURCE_STATUS,
        Permission.READ_OPTIMIZATION,
        Permission.READ_ALERTS,
        Permission.UPDATE_ALERT,  # Acknowledgement / status update
    },
    RoleName.ANALYST: {
        Permission.SUBMIT_OBSERVATIONS,
        Permission.READ_OBSERVATIONS,
        Permission.REQUEST_RISK_ASSESSMENT,
        Permission.READ_RISK_ASSESSMENT,
        Permission.READ_HEALTH_IMPACT,
        Permission.READ_RESOURCES,
        Permission.READ_OPTIMIZATION,
        Permission.READ_SIMULATION,
        Permission.READ_ALERTS,
        Permission.READ_REPORTS,
    },
}


def user_has_permission(user_roles: List[str], required_permission: Permission) -> bool:
    """Check if any of the user's roles grant the required permission."""
    for role_str in user_roles:
        try:
            role = RoleName(role_str)
            if required_permission in ROLE_PERMISSIONS.get(role, set()):
                return True
        except ValueError:
            continue
    return False


def enforce_geographic_scope(
    user_state_id: Optional[str],
    user_district_id: Optional[str],
    target_state_id: Optional[str] = None,
    target_district_id: Optional[str] = None,
    target_district_state_id: Optional[str] = None,
    is_administrator: bool = False,
) -> None:
    """Validate that the user's assigned geographic boundary covers the requested resource or area.

    If user has no state_id and no district_id, or is an Administrator, they have nationwide scope.
    If user is restricted to a state, they cannot access another state or its districts.
    If user is restricted to a district, they cannot access any other district.
    """
    if is_administrator:
        return

    # If user has no geographic restrictions, they have national clearance
    if not user_state_id and not user_district_id:
        return

    # Check district restriction
    if user_district_id:
        if target_district_id and target_district_id != user_district_id:
            raise GeographicScopeError(
                f"User is restricted to district '{user_district_id}' but requested district '{target_district_id}'."
            )
        if target_state_id and user_state_id and target_state_id != user_state_id:
            raise GeographicScopeError(
                f"User is restricted to state '{user_state_id}' but requested state '{target_state_id}'."
            )
        return

    # Check state restriction
    if user_state_id:
        if target_state_id and target_state_id != user_state_id:
            raise GeographicScopeError(
                f"User is restricted to state '{user_state_id}' but requested state '{target_state_id}'."
            )
        if target_district_state_id and target_district_state_id != user_state_id:
            raise GeographicScopeError(
                f"Target district belongs to state '{target_district_state_id}', outside assigned state '{user_state_id}'."
            )
