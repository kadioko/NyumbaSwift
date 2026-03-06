import enum
from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class AgentStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    SUSPENDED = "suspended"
    REJECTED = "rejected"


class AgentProfile(Base):
    """Verified Agent — converted brokers who earn commissions."""

    __tablename__ = "agent_profiles"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, index=True)
    status: Mapped[AgentStatus] = mapped_column(
        Enum(AgentStatus), default=AgentStatus.PENDING
    )
    business_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    license_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    operating_districts: Mapped[str] = mapped_column(
        Text, default=""
    )  # comma-separated: "Kinondoni,Ilala"
    commission_rate: Mapped[float] = mapped_column(Float, default=10.0)  # % of platform fee
    total_listings: Mapped[int] = mapped_column(Integer, default=0)
    total_rentals_facilitated: Mapped[int] = mapped_column(Integer, default=0)
    rating: Mapped[float] = mapped_column(Float, default=0.0)
    approved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    user = relationship("User", back_populates="agent_profile")
