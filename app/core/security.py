from datetime import datetime, timedelta, timezone

import bcrypt
import hashlib
import hmac
import jwt

from app.core.config import settings


LEGACY_HMAC_PREFIX = "hmac_sha256$"


def _legacy_hash_password(password: str) -> str:
    return hmac.new(settings.SECRET_KEY.encode(), password.encode(), hashlib.sha256).hexdigest()


def hash_password(password: str) -> str:
    """Hash password using bcrypt."""
    return bcrypt.hashpw(
        password.encode("utf-8"),
        bcrypt.gensalt(rounds=settings.BCRYPT_ROUNDS),
    ).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    if hashed_password.startswith(("$2a$", "$2b$", "$2y$")):
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

    legacy_hash = hashed_password.removeprefix(LEGACY_HMAC_PREFIX)
    return hmac.compare_digest(_legacy_hash_password(plain_password), legacy_hash)


def password_needs_rehash(hashed_password: str) -> bool:
    return not hashed_password.startswith(("$2a$", "$2b$", "$2y$"))


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    if "sub" in to_encode:
        to_encode["sub"] = str(to_encode["sub"])
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    to_encode["exp"] = expire
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except jwt.PyJWTError:
        return None
