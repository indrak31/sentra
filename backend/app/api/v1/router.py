"""Central API v1 router combining all endpoint modules."""

from fastapi import APIRouter
from app.api.v1.endpoints import (
    admin,
    alerts,
    auth,
    hazards,
    health_impacts,
    locations,
    observations,
    optimization,
    reports,
    resources,
    risk_assessments,
    simulations,
    users,
)

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(admin.router)
api_router.include_router(locations.router)
api_router.include_router(observations.router)
api_router.include_router(hazards.router)
api_router.include_router(risk_assessments.router)
api_router.include_router(health_impacts.router)
api_router.include_router(resources.router)
api_router.include_router(optimization.router)
api_router.include_router(simulations.router)
api_router.include_router(alerts.router)
api_router.include_router(reports.router)
