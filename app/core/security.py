from datetime import datetime, timedelta, timezone

import base64
import hashlib
import hmac
import json

from app.core.config import settings


def hash_password(password: str) -> str:
    """Hash password using HMAC-SHA256 with the secret key."""
    return hmac.new(
        settings.SECRET_KEY.encode(), password.encode(), hashlib.sha256
    ).hexdigest()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return hmac.compare_digest(hash_password(plain_password), hashed_password)


def _b64_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _b64_decode(s: str) -> bytes:
    padding = 4 - len(s) % 4
    if padding != 4:
        s += "=" * padding
    return base64.urlsafe_b64decode(s)


def create_access_token(data: dict) -> str:
    """Create a HS256 JWT token (pure Python, no external deps)."""
    header = {"alg": "HS256", "typ": "JWT"}
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    to_encode["exp"] = int(expire.timestamp())

    header_b64 = _b64_encode(json.dumps(header, separators=(",", ":")).encode())
    payload_b64 = _b64_encode(json.dumps(to_encode, separators=(",", ":")).encode())

    signing_input = f"{header_b64}.{payload_b64}"
    signature = hmac.new(
        settings.SECRET_KEY.encode(), signing_input.encode(), hashlib.sha256
    ).digest()
    sig_b64 = _b64_encode(signature)

    return f"{header_b64}.{payload_b64}.{sig_b64}"


def decode_access_token(token: str) -> dict | None:
    """Decode and verify a HS256 JWT token."""
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None

        header_b64, payload_b64, sig_b64 = parts

        # Verify signature
        signing_input = f"{header_b64}.{payload_b64}"
        expected_sig = hmac.new(
            settings.SECRET_KEY.encode(), signing_input.encode(), hashlib.sha256
        ).digest()
        actual_sig = _b64_decode(sig_b64)

        if not hmac.compare_digest(expected_sig, actual_sig):
            return None

        payload = json.loads(_b64_decode(payload_b64))

        # Check expiration
        exp = payload.get("exp")
        if exp and datetime.now(timezone.utc).timestamp() > exp:
            return None

        return payload
    except Exception:
        return None
