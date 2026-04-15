from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_admin
from app.core.database import get_db
from app.models.agent import AgentProfile, AgentStatus
from app.models.user import User, UserRole
from app.schemas.agent import AgentApply, AgentApproval, AgentResponse
import logging

router = APIRouter(prefix="/agents", tags=["Verified Agents"])
logger = logging.getLogger(__name__)

@router.post("/apply", response_model=AgentResponse, status_code=201)
def apply_as_agent(
    data: AgentApply,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Broker applies to become a Verified Agent."""
    existing = db.query(AgentProfile).filter(
        AgentProfile.user_id == current_user.id
    ).first()
    if existing:
        raise HTTPException(
            status_code=400, detail="You already have an agent application"
        )

    profile = AgentProfile(
        user_id=current_user.id,
        business_name=data.business_name,
        license_number=data.license_number,
        bio=data.bio,
        operating_districts=data.operating_districts,
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


@router.get("/me", response_model=AgentResponse)
def my_agent_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = db.query(AgentProfile).filter(
        AgentProfile.user_id == current_user.id
    ).first()
    if not profile:
        raise HTTPException(status_code=404, detail="No agent profile found")
    return profile


@router.get("/", response_model=list[AgentResponse])
def list_agents(db: Session = Depends(get_db)):
    """List all approved verified agents."""
    return (
        db.query(AgentProfile)
        .filter(AgentProfile.status == AgentStatus.APPROVED)
        .order_by(AgentProfile.rating.desc())
        .all()
    )


@router.get("/pending", response_model=list[AgentResponse])
def list_pending_agents(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Admin: list pending agent applications."""
    return (
        db.query(AgentProfile)
        .filter(AgentProfile.status == AgentStatus.PENDING)
        .all()
    )


@router.post("/{agent_id}/review", response_model=AgentResponse)
def review_agent(
    agent_id: int,
    data: AgentApproval,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Admin approves or rejects an agent application."""
    profile = db.query(AgentProfile).filter(AgentProfile.id == agent_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Agent profile not found")

    previous_status = profile.status
    profile.status = data.status
    if data.commission_rate is not None:
        profile.commission_rate = data.commission_rate
    user = db.query(User).filter(User.id == profile.user_id).first()
    if data.status == AgentStatus.APPROVED:
        profile.approved_at = datetime.now(timezone.utc)
        if user:
            user.role = UserRole.AGENT
    elif user and user.role == UserRole.AGENT:
        user.role = UserRole.RENTER
 
    db.commit()
    db.refresh(profile)
    logger.info(
        "admin_agent_review admin_id=%s agent_profile_id=%s user_id=%s previous_status=%s new_status=%s commission_rate=%s",
        current_user.id,
        profile.id,
        profile.user_id,
        previous_status,
        profile.status,
        profile.commission_rate,
    )
    return profile
