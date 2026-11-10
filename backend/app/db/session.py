"""Database engine, session management, and connectivity diagnostics."""

from typing import Generator, Optional, Tuple
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.exc import OperationalError, SQLAlchemyError
from app.core.config import settings
from app.core.logging import logger

"""Database engine, session management, and connectivity diagnostics."""

import os
from typing import Generator, Optional, Tuple
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.exc import OperationalError, SQLAlchemyError
from app.core.config import settings
from app.core.logging import logger


def _init_resilient_engine():
    """Initializes the database engine.
    If PostgreSQL is reachable, connects to PostgreSQL.
    Otherwise, seamlessly falls back to a self-contained local SQLite database (sentra.db).
    """
    if settings.DATABASE_URL.startswith("sqlite"):
        return create_engine(
            settings.DATABASE_URL,
            echo=settings.DEBUG,
            connect_args={"check_same_thread": False},
        )

    # Attempt connecting to configured PostgreSQL with a short connection timeout
    try:
        pg_engine = create_engine(
            settings.DATABASE_URL,
            echo=settings.DEBUG,
            pool_pre_ping=True,
            connect_args={"connect_timeout": 2},
        )
        with pg_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("Connected to primary PostgreSQL database.")
        return pg_engine
    except Exception as exc:
        logger.warning(
            "Primary PostgreSQL unavailable (%s). Falling back to resilient local SQLite database (sentra.db).",
            str(exc),
        )
        sqlite_engine = create_engine(
            "sqlite:///sentra.db",
            echo=settings.DEBUG,
            connect_args={"check_same_thread": False},
        )
        # Auto-create tables and bootstrap initial admin/operator users
        try:
            from app.db.base import Base
            import app.models  # noqa: F401
            Base.metadata.create_all(bind=sqlite_engine)
            from app.db.init_db import init_db
            with Session(sqlite_engine) as session:
                init_db(session)
        except Exception as seed_err:
            logger.warning("Error bootstrapping SQLite tables: %s", str(seed_err))
        return sqlite_engine


engine = _init_resilient_engine()

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False,
)


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that yields a SQLAlchemy database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_db_connection() -> Tuple[bool, Optional[str]]:
    """Test connection to the configured database. Returns (is_healthy, error_message)."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True, None
    except OperationalError as exc:
        msg = (
            f"Cannot connect to database at {settings.DATABASE_URL.split('@')[-1] if '@' in settings.DATABASE_URL else 'configured URL'}. "
            f"Please ensure PostgreSQL service is running and credentials in .env are correct. Detail: {str(exc)}"
        )
        logger.error(msg)
        return False, msg
    except SQLAlchemyError as exc:
        msg = f"Database error during connectivity test: {str(exc)}"
        logger.error(msg)
        return False, msg
    except Exception as exc:
        msg = f"Unexpected error connecting to database: {str(exc)}"
        logger.error(msg)
        return False, msg
