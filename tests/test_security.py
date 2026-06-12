from datetime import datetime, timedelta, timezone
import hashlib
import hmac

import jwt

from app.core.config import settings
from app.core.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    password_needs_rehash,
    verify_password,
)


def test_hash_password_uses_bcrypt():
    hashed = hash_password("correct horse")

    assert hashed.startswith("$2")
    assert verify_password("correct horse", hashed)
    assert not verify_password("wrong", hashed)
    assert password_needs_rehash(hashed) is False


def test_verify_password_accepts_legacy_hmac_hashes():
    legacy_hash = hmac.new(
        settings.SECRET_KEY.encode(),
        "testpass123".encode(),
        hashlib.sha256,
    ).hexdigest()

    assert verify_password("testpass123", legacy_hash)
    assert password_needs_rehash(legacy_hash) is True


def test_access_token_roundtrip_uses_jwt_library():
    token = create_access_token({"sub": 123})
    payload = decode_access_token(token)

    assert payload["sub"] == "123"


def test_expired_access_token_is_rejected():
    token = jwt.encode(
        {"sub": "123", "exp": datetime.now(timezone.utc) - timedelta(minutes=1)},
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )

    assert decode_access_token(token) is None
