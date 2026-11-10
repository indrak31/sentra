"""Command-line script to bootstrap or verify an administrator account."""

import argparse
import sys
from pathlib import Path

# Ensure BACKEND directory is in sys.path so script can be run from any working directory
BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.core.config import settings
from app.core.logging import logger, setup_logging
from app.core.permissions import RoleName
from app.core.security import get_password_hash
from app.db.init_db import init_db
from app.db.session import SessionLocal
from app.models.role import Role
from app.models.user import User


def bootstrap_admin(email: str, password: str, full_name: str) -> None:
    setup_logging()
    db = SessionLocal()
    try:
        # Initialize standard roles first
        init_db(db)

        admin_role = db.query(Role).filter(Role.name == RoleName.ADMINISTRATOR.value).first()
        if not admin_role:
            logger.error("Administrator role could not be initialized.")
            sys.exit(1)

        user = db.query(User).filter(User.email == email.lower()).first()
        if user:
            logger.info("User '%s' already exists. Ensuring Administrator role is granted.", email)
            if admin_role not in user.roles:
                user.roles.append(admin_role)
            user.is_active = True
            db.commit()
            logger.info("Administrator privileges verified for '%s'.", email)
            return

        new_admin = User(
            email=email.lower(),
            hashed_password=get_password_hash(password),
            full_name=full_name,
            is_active=True,
            roles=[admin_role],
        )
        db.add(new_admin)
        db.commit()
        logger.info("Administrator account created successfully: %s", email)
    except Exception as exc:
        logger.error("Failed to bootstrap administrator: %s", exc)
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Bootstrap SENTRA Administrator User")
    parser.add_argument(
        "--email",
        default=settings.FIRST_SUPERUSER_EMAIL,
        help="Administrator email address",
    )
    parser.add_argument(
        "--password",
        default=settings.FIRST_SUPERUSER_PASSWORD,
        help="Administrator password",
    )
    parser.add_argument(
        "--name",
        default=settings.FIRST_SUPERUSER_NAME,
        help="Administrator full name",
    )
    args = parser.parse_args()

    if not args.email or not args.password:
        print("Error: Both email and password must be configured or supplied as arguments.")
        sys.exit(1)

    bootstrap_admin(args.email, args.password, args.name)
