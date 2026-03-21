from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_admin
from app.core.database import get_db
from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User, VerificationStatus
from app.schemas.user import (
    TokenResponse,
    UserLogin,
    UserRegister,
    UserResponse,
    UserUpdate,
    VerificationRequest,
    UserVerificationReview,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(data: UserRegister, db: Session = Depends(get_db)):
    phone = data.phone.strip()
    full_name = data.full_name.strip()
    email = data.email.strip() if data.email else None

    if db.query(User).filter(User.phone == phone).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number already registered",
        )
    if email and db.query(User).filter(User.email == email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email address already in use",
        )
    user = User(
        phone=phone,
        full_name=full_name,
        hashed_password=hash_password(data.password),
        email=email,
        role=data.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token({"sub": user.id})
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


@router.post("/login", response_model=TokenResponse)
def login(data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.phone == data.phone.strip()).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid phone or password",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Account deactivated"
        )
    token = create_access_token({"sub": user.id})
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserResponse)
def update_me(
    data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    updates = data.model_dump(exclude_unset=True)

    if "email" in updates:
        email = data.email.strip() if data.email else None
        if email:
            existing_email = db.query(User).filter(User.email == email, User.id != current_user.id).first()
            if existing_email:
                raise HTTPException(status_code=400, detail="Email address already in use")
        updates["email"] = email
    if "full_name" in updates and updates["full_name"] is not None:
        updates["full_name"] = updates["full_name"].strip()
    if "national_id" in updates and updates["national_id"] is not None:
        updates["national_id"] = updates["national_id"].strip()

    for field, value in updates.items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/verifications/pending", response_model=list[UserResponse])
def list_pending_user_verifications(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return (
        db.query(User)
        .filter(User.verification_status == VerificationStatus.PENDING)
        .order_by(User.created_at.desc())
        .all()
    )


@router.post("/verifications/{user_id}/review", response_model=UserResponse)
def review_user_verification(
    user_id: int,
    data: UserVerificationReview,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if data.verification_status not in (VerificationStatus.VERIFIED, VerificationStatus.REJECTED):
        raise HTTPException(status_code=400, detail="Verification review must be verified or rejected")
    user.verification_status = data.verification_status
    db.commit()
    db.refresh(user)
    return user


@router.post("/verify", response_model=UserResponse)
def request_verification(
    data: VerificationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Submit national ID for verification."""
    if not current_user.email:
        raise HTTPException(status_code=400, detail="Please add your email in your profile before requesting verification")
    current_user.national_id = data.national_id.strip()
    if data.profile_photo_url:
        current_user.profile_photo_url = data.profile_photo_url
    current_user.verification_status = VerificationStatus.PENDING
    db.commit()
    db.refresh(current_user)
    return current_user
