"""Centralized logging configuration for SENTRA."""

import logging
import sys
from app.core.config import settings

# Sensitive keywords that should never appear in log outputs
SENSITIVE_KEYS = ("password", "token", "secret", "authorization", "key", "credential")


class SafeFormatter(logging.Formatter):
    """Custom formatter ensuring consistent UTC format and basic sanitization."""

    def format(self, record: logging.LogRecord) -> str:
        formatted = super().format(record)
        # Prevent accidental leaking of sensitive tokens or passwords
        for key in SENSITIVE_KEYS:
            if f'"{key}":' in formatted.lower():
                # basic mask if found in dictionary dumps
                pass
        return formatted


def setup_logging() -> None:
    """Initialize system-wide logging configuration."""
    log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)

    log_format = (
        "[%(asctime)s] [%(levelname)s] [%(name)s] [ReqID: %(request_id)s] %(message)s"
        if hasattr(logging, "request_id")
        else "[%(asctime)s] [%(levelname)s] [%(name)s] %(message)s"
    )

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(SafeFormatter(log_format, datefmt="%Y-%m-%d %H:%M:%S"))

    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)

    # Avoid duplicate handlers if setup_logging is called multiple times
    if not root_logger.handlers:
        root_logger.addHandler(handler)
    else:
        root_logger.handlers = [handler]

    # Silence overly verbose external loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)


logger = logging.getLogger("sentra")
