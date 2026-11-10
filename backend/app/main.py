"""FastAPI main application entrypoint for SENTRA."""

import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import AsyncGenerator
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.api.v1.router import api_router
from app.core.config import settings
from app.core.exceptions import SentraException, sentra_exception_handler
from app.core.logging import logger, setup_logging
from app.core.middleware import RequestCorrelationMiddleware
from app.db.session import check_db_connection


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan setup and teardown."""
    setup_logging()
    logger.info("Starting %s in %s mode", settings.PROJECT_NAME, settings.ENVIRONMENT)
    is_ready, err = check_db_connection()
    if is_ready:
        logger.info("Database connection established successfully.")
    else:
        logger.warning("Database is currently not reachable: %s", err)
    yield
    logger.info("Shutting down %s", settings.PROJECT_NAME)


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="0.1.0",
    description=(
        "SENTRA is an India-wide disaster-risk assessment, health-impact estimation, "
        "and emergency-resource optimization platform built with FastAPI, PostgreSQL, and Google OR-Tools."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# 1. Request Correlation & Profiling Middleware
app.add_middleware(RequestCorrelationMiddleware)

# 2. CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Exception Handlers
app.add_exception_handler(SentraException, sentra_exception_handler)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    request_id = getattr(request.state, "request_id", str(uuid.uuid4()))
    logger.error("Unhandled server exception [ReqID: %s]: %s", request_id, exc, exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected internal error occurred. Please contact system administrator.",
                "request_id": request_id,
            }
        },
    )


# 4. Operational Health Endpoints
@app.get("/health/live", tags=["Operational Health"], status_code=status.HTTP_200_OK)
def liveness() -> dict:
    """Liveness probe to confirm the FastAPI process is responsive."""
    return {
        "status": "alive",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "environment": settings.ENVIRONMENT,
    }


@app.get("/health/ready", tags=["Operational Health"])
def readiness() -> JSONResponse:
    """Readiness probe evaluating critical dependency availability including PostgreSQL."""
    is_db_ready, error_msg = check_db_connection()
    timestamp = datetime.now(timezone.utc).isoformat()

    if not is_db_ready:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "not_ready",
                "database": "unreachable",
                "error": error_msg,
                "timestamp": timestamp,
            },
        )

    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "status": "ready",
            "database": "connected",
            "timestamp": timestamp,
        },
    )


# 5. Attach API v1 Router
app.include_router(api_router, prefix=settings.API_V1_STR)
