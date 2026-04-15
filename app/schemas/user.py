from datetime import datetime
from base64 import b64decode

from pydantic import BaseModel, field_validator

from app.models.user import UserRole, VerificationStatus


class UserRegister(BaseModel):
    phone: str
    full_name: str
    password: str
    email: str | None = None
    role: UserRole = UserRole.RENTER


class UserLogin(BaseModel):
    phone: str
    password: str


class UserResponse(BaseModel):
    id: int
    phone: str
    email: str | None
    full_name: str
    role: UserRole
    verification_status: VerificationStatus
    national_id: str | None
    profile_photo_url: str | None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    full_name: str | None = None
    email: str | None = None
    national_id: str | None = None
    profile_photo_url: str | None = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class VerificationRequest(BaseModel):
    national_id: str
    profile_photo_url: str | None = None

    @field_validator("national_id")
    @classmethod
    def validate_national_id(cls, value: str) -> str:
        normalized = value.strip()
        compact = "".join(ch for ch in normalized if ch.isalnum())
        if len(compact) < 6:
            raise ValueError("National ID looks too short")
        return normalized

    @field_validator("profile_photo_url")
    @classmethod
    def validate_profile_photo_url(cls, value: str | None) -> str | None:
        if value is None:
            return value

        normalized = value.strip()
        if not normalized:
            return None

        allowed_prefixes = (
            "data:image/jpeg;base64,",
            "data:image/jpg;base64,",
            "data:image/png;base64,",
            "data:image/webp;base64,",
        )
        if not normalized.startswith(allowed_prefixes):
            raise ValueError("Profile photo must be a JPEG, PNG, or WebP image")

        try:
            encoded = normalized.split(",", 1)[1]
            decoded = b64decode(encoded, validate=True)
        except Exception as exc:
            raise ValueError("Profile photo must be a valid base64 image") from exc

        if len(decoded) > 5 * 1024 * 1024:
            raise ValueError("Profile photo must be 5MB or smaller")

        return normalized


class UserVerificationReview(BaseModel):
    verification_status: VerificationStatus
