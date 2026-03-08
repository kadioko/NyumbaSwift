from datetime import datetime

from pydantic import BaseModel

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
