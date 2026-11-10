"""Authentication and token lifecycle service."""

import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.exceptions import AuthenticationError, EntityAlreadyExistsException
from app.core.logging import logger
from app.core.permissions import RoleName
from app.core.security import (
    create_access_token,
    generate_opaque_token,
    get_password_hash,
    hash_token,
    verify_password,
)
from app.models.role import Role
from app.models.user import RefreshSession, User
from app.schemas.auth import LoginRequest, PasswordChangeRequest, RegisterRequest, TokenResponse


def _ensure_utc(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


class AuthService:
    """Manages authentication, Argon2id verification, and refresh session rotation."""

    def register(self, db: Session, req: RegisterRequest) -> User:
        existing = db.query(User).filter(User.email == req.email.lower()).first()
        if existing:
            raise EntityAlreadyExistsException("User", "email", req.email)

        # Default role assigned safely; registration never grants elevated privileges
        default_role = db.query(Role).filter(Role.name == RoleName.ANALYST.value).first()
        roles = [default_role] if default_role else []

        user = User(
            email=req.email.lower(),
            hashed_password=get_password_hash(req.password),
            full_name=req.full_name,
            is_active=True,
            roles=roles,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        logger.info("New user registered: %s (id: %s)", user.email, user.id)
        return user

    def login(self, db: Session, req: LoginRequest, ip_address: Optional[str] = None) -> TokenResponse:
        user = db.query(User).filter(User.email == req.email.lower()).first()
        if not user:
            # Generic error to prevent account enumeration
            raise AuthenticationError("Invalid email or password.")

        # Check account lockout
        now = datetime.now(timezone.utc)
        if user.locked_until and _ensure_utc(user.locked_until) > now:
            raise AuthenticationError("Account temporarily locked due to failed attempts. Please try again later.")

        if not user.is_active:
            raise AuthenticationError("This account has been deactivated.")

        if not verify_password(req.password, user.hashed_password):
            user.failed_login_attempts += 1
            if user.failed_login_attempts >= 5:
                user.locked_until = now + timedelta(minutes=15)
                logger.warning("Account locked for %s due to repeated failed logins", user.email)
            db.commit()
            raise AuthenticationError("Invalid email or password.")

        # Reset failed attempts on successful authentication
        user.failed_login_attempts = 0
        user.locked_until = None

        # Build access token claims
        role_names = [r.name for r in user.roles]
        claims = {
            "roles": role_names,
            "state_id": user.state_id,
            "district_id": user.district_id,
        }
        access_token = create_access_token(subject=user.id, claims=claims)

        # Create opaque refresh token and session
        raw_refresh_token = generate_opaque_token()
        token_hash_val = hash_token(raw_refresh_token)
        family_id = str(uuid.uuid4())
        expires_at = now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

        session = RefreshSession(
            user_id=user.id,
            token_hash=token_hash_val,
            family_id=family_id,
            is_revoked=False,
            expires_at=expires_at,
        )
        db.add(session)
        db.commit()

        logger.info("Successful login for user: %s (IP: %s)", user.email, ip_address)
        return TokenResponse(
            access_token=access_token,
            refresh_token=raw_refresh_token,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

    def refresh_token(self, db: Session, raw_refresh_token: str) -> TokenResponse:
        token_hash_val = hash_token(raw_refresh_token)
        session = db.query(RefreshSession).filter(RefreshSession.token_hash == token_hash_val).first()

        now = datetime.now(timezone.utc)
        if not session:
            raise AuthenticationError("Invalid refresh token.", code="INVALID_REFRESH_TOKEN")

        # REUSE DETECTION: If an already replaced or revoked session is submitted again,
        # invalidate the entire token family immediately as a security breach safeguard.
        if session.is_revoked or session.replaced_by is not None:
            db.query(RefreshSession).filter(RefreshSession.family_id == session.family_id).update(
                {"is_revoked": True}
            )
            db.commit()
            logger.warning(
                "Detected refresh token reuse for family %s! Revoked all sessions in family.",
                session.family_id,
            )
            raise AuthenticationError("Refresh token reuse detected. All sessions terminated.", code="TOKEN_REUSE_DETECTED")

        if _ensure_utc(session.expires_at) < now:
            session.is_revoked = True
            db.commit()
            raise AuthenticationError("Refresh token has expired.", code="REFRESH_TOKEN_EXPIRED")

        user = db.query(User).filter(User.id == session.user_id).first()
        if not user or not user.is_active:
            raise AuthenticationError("Associated user is inactive or deleted.")

        # Rotate refresh token: create new opaque token in same family and mark old as replaced
        new_raw_token = generate_opaque_token()
        new_token_hash = hash_token(new_raw_token)
        new_expires_at = now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

        session.replaced_by = new_token_hash
        session.is_revoked = True

        new_session = RefreshSession(
            user_id=user.id,
            token_hash=new_token_hash,
            family_id=session.family_id,
            is_revoked=False,
            expires_at=new_expires_at,
        )
        db.add(new_session)

        # Issue new access token
        role_names = [r.name for r in user.roles]
        claims = {
            "roles": role_names,
            "state_id": user.state_id,
            "district_id": user.district_id,
        }
        new_access_token = create_access_token(subject=user.id, claims=claims)
        db.commit()

        return TokenResponse(
            access_token=new_access_token,
            refresh_token=new_raw_token,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

    def logout(self, db: Session, raw_refresh_token: str) -> None:
        token_hash_val = hash_token(raw_refresh_token)
        session = db.query(RefreshSession).filter(RefreshSession.token_hash == token_hash_val).first()
        if session:
            session.is_revoked = True
            db.commit()
            logger.info("Refresh session revoked for user %s", session.user_id)

    def change_password(self, db: Session, user: User, req: PasswordChangeRequest) -> None:
        if not verify_password(req.current_password, user.hashed_password):
            raise AuthenticationError("Current password incorrect.")

        user.hashed_password = get_password_hash(req.new_password)
        # Invalidate all active refresh sessions on password change
        db.query(RefreshSession).filter(RefreshSession.user_id == user.id).update({"is_revoked": True})
        db.commit()
        logger.info("Password changed and refresh sessions invalidated for %s", user.email)


auth_service = AuthService()
