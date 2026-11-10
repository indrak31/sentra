"""Custom domain exceptions and error handlers for SENTRA."""

from typing import Any, Optional
from fastapi import Request, status
from fastapi.responses import JSONResponse


class SentraException(Exception):
    """Base exception for all domain errors."""

    def __init__(
        self,
        message: str,
        code: str = "INTERNAL_SERVER_ERROR",
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        details: Optional[Any] = None,
    ):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details


class EntityNotFoundException(SentraException):
    def __init__(self, entity_name: str, identifier: Any):
        super().__init__(
            message=f"{entity_name} with identifier '{identifier}' not found.",
            code="ENTITY_NOT_FOUND",
            status_code=status.HTTP_404_NOT_FOUND,
        )


class EntityAlreadyExistsException(SentraException):
    def __init__(self, entity_name: str, field: str, value: Any):
        super().__init__(
            message=f"{entity_name} with {field} '{value}' already exists.",
            code="ENTITY_ALREADY_EXISTS",
            status_code=status.HTTP_409_CONFLICT,
        )


class AuthenticationError(SentraException):
    def __init__(self, message: str = "Authentication failed.", code: str = "AUTHENTICATION_FAILED"):
        super().__init__(
            message=message,
            code=code,
            status_code=status.HTTP_401_UNAUTHORIZED,
        )


class PermissionDeniedError(SentraException):
    def __init__(self, message: str = "You do not have permission to perform this action."):
        super().__init__(
            message=message,
            code="PERMISSION_DENIED",
            status_code=status.HTTP_403_FORBIDDEN,
        )


class GeographicScopeError(SentraException):
    def __init__(self, message: str = "Access denied for the requested geographic scope."):
        super().__init__(
            message=message,
            code="GEOGRAPHIC_SCOPE_DENIED",
            status_code=status.HTTP_403_FORBIDDEN,
        )


class ModelUnavailableException(SentraException):
    def __init__(self, hazard_type: str, details: Optional[str] = None):
        super().__init__(
            message=f"Prediction model for hazard '{hazard_type}' is currently unavailable or unconfigured.",
            code="MODEL_UNAVAILABLE",
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            details=details,
        )


class InsufficientDataException(SentraException):
    def __init__(self, message: str, missing_fields: Optional[Any] = None):
        super().__init__(
            message=message,
            code="INSUFFICIENT_DATA",
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            details={"missing": missing_fields} if missing_fields else None,
        )


class OptimizationError(SentraException):
    def __init__(self, message: str, status_code: int = status.HTTP_400_BAD_REQUEST, details: Optional[Any] = None):
        super().__init__(
            message=message,
            code="OPTIMIZATION_ERROR",
            status_code=status_code,
            details=details,
        )


async def sentra_exception_handler(request: Request, exc: SentraException) -> JSONResponse:
    request_id = getattr(request.state, "request_id", None)
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.code,
                "message": exc.message,
                "details": exc.details,
                "request_id": request_id,
            }
        },
    )
