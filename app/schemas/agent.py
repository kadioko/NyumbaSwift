from datetime import datetime

from pydantic import BaseModel

from app.models.agent import AgentStatus


class AgentApply(BaseModel):
    business_name: str | None = None
    license_number: str | None = None
    bio: str | None = None
    operating_districts: str  # comma-separated: "Kinondoni,Ilala"


class AgentResponse(BaseModel):
    id: int
    user_id: int
    status: AgentStatus
    business_name: str | None
    license_number: str | None
    bio: str | None
    operating_districts: str
    commission_rate: float
    total_listings: int
    total_rentals_facilitated: int
    rating: float
    approved_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class AgentApproval(BaseModel):
    status: AgentStatus
    commission_rate: float | None = None
