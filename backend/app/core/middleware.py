"""FastAPI middleware for request correlation and security safeguards."""

import time
import uuid
from collections import defaultdict
from typing import Callable, Dict, List
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware


class RequestCorrelationMiddleware(BaseHTTPMiddleware):
    """Assigns and attaches a unique X-Request-ID header to every incoming HTTP request."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        request.state.request_id = request_id
        start_time = time.perf_counter()

        response: Response = await call_next(request)

        duration_ms = (time.perf_counter() - start_time) * 1000
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Process-Time-MS"] = f"{duration_ms:.2f}"
        return response


class SimpleRateLimiter:
    """Sliding-window in-memory rate limiter for login protection and expensive operations."""

    def __init__(self):
        self._requests: Dict[str, List[float]] = defaultdict(list)

    def is_allowed(self, key: str, max_requests: int, window_seconds: int = 60) -> bool:
        now = time.time()
        timestamps = self._requests[key]
        # Filter timestamps within current window
        self._requests[key] = [t for t in timestamps if now - t < window_seconds]
        if len(self._requests[key]) >= max_requests:
            return False
        self._requests[key].append(now)
        return True


rate_limiter = SimpleRateLimiter()
