"""
Authentication utilities for Artius Lab.
Handles password hashing, JWT token creation/verification,
and FastAPI dependency for protecting routes.
"""

import os
from datetime import datetime, timedelta, timezone
from pathlib import Path

import bcrypt
import jwt
from dotenv import find_dotenv, load_dotenv
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

# Load from unified root .env or local .env
_env_path = find_dotenv(usecwd=True) or str(Path(__file__).resolve().parent.parent / ".env")
load_dotenv(_env_path)

# ── Configuration ──────────────────────────────────────────────────
SECRET_KEY = (
    os.getenv("JWT_SECRET")
    or os.getenv("JWT_SECRET_KEY")
    or "artius-lab-secret-key-change-in-production"
)
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 72  # 3 days

security = HTTPBearer(auto_error=False)


# ── Password Utilities ────────────────────────────────────────────


def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its bcrypt hash."""
    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        hashed_password.encode("utf-8"),
    )


# ── JWT Token Utilities ───────────────────────────────────────────


def create_access_token(user_id: int | str, email: str) -> str:
    """Create a JWT access token."""
    payload = {
        "sub": str(user_id),
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict:
    """Decode and validate a JWT token. Supports both local and Supabase JWT secrets."""
    # 1. Try local secret
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        pass

    # 2. Try Supabase JWT secret if configured
    if SUPABASE_JWT_SECRET:
        try:
            return jwt.decode(
                token,
                SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                audience="authenticated",
            )
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token has expired")
        except jwt.InvalidTokenError:
            pass

    raise HTTPException(status_code=401, detail="Invalid token")


# ── FastAPI Dependencies ──────────────────────────────────────────


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> dict:
    """
    Dependency that extracts and validates the JWT token from the
    Authorization header. Returns the decoded payload dict.
    """
    if credentials is None:
        raise HTTPException(status_code=401, detail="Not authenticated")

    payload = decode_access_token(credentials.credentials)
    return {
        "user_id": int(payload["sub"]),
        "email": payload["email"],
    }


async def get_optional_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> dict | None:
    """
    Optional auth dependency — returns user info if a valid token is
    present, or None if no token is provided. Does NOT raise errors.
    """
    if credentials is None:
        return None
    try:
        payload = decode_access_token(credentials.credentials)
        return {
            "user_id": int(payload["sub"]),
            "email": payload["email"],
        }
    except HTTPException:
        return None
