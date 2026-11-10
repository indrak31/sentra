"""Security utilities for password hashing and JWT token management."""

import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional
import jwt
from argon2 import PasswordHasher, Type
from argon2.exceptions import VerifyMismatchError, VerificationError
from app.core.config import settings
from app.core.exceptions import AuthenticationError

# Argon2id password hasher configuration adhering to modern RFC 9106 recommendations
_hasher = PasswordHasher(
    time_cost=2,
    memory_cost=65536,  # 64 MiB
    parallelism=1,
    hash_len=32,
    type=Type.ID,
)


def get_password_hash(password: str) -> str:
    """Hash a plaintext password using Argon2id."""
    return _hasher.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against an Argon2id hash."""
    try:
        return _hasher.verify(hashed_password, plain_password)
    except (VerifyMismatchError, VerificationError, Exception):
        return False


def generate_opaque_token() -> str:
    """Generate a high-entropy cryptographically secure opaque token for refresh sessions."""
    return secrets.token_urlsafe(64)


def hash_token(raw_token: str) -> str:
    """Hash an opaque refresh token using SHA-256 for persistent database storage."""
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


def create_access_token(
    subject: str,
    claims: Optional[Dict[str, Any]] = None,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """Create a signed JWT access token with standard and custom claims."""
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    payload: Dict[str, Any] = {
        "sub": str(subject),
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
        "iss": settings.JWT_ISSUER,
        "aud": settings.JWT_AUDIENCE,
        "token_type": "access",
    }
    if claims:
        # Prevent claims from overriding critical subject or timing fields
        for k, v in claims.items():
            if k not in ("sub", "iat", "exp", "iss", "aud", "token_type"):
                payload[k] = v

    encoded_jwt = jwt.encode(
        payload,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )
    return encoded_jwt


def decode_access_token(token: str) -> Dict[str, Any]:
    """Decode and validate a JWT access token signature and standard claims."""
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
            issuer=settings.JWT_ISSUER,
            audience=settings.JWT_AUDIENCE,
        )
        if payload.get("token_type") != "access":
            raise AuthenticationError("Invalid token type: expected access token.")
        return payload
    except jwt.ExpiredSignatureError:
        raise AuthenticationError("Token has expired.", code="TOKEN_EXPIRED")
    except jwt.InvalidTokenError as exc:
        raise AuthenticationError(f"Invalid token: {str(exc)}", code="TOKEN_INVALID")
