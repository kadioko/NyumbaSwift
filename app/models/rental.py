import enum
from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class RentalStatus(str, enum.Enum):
    ACTIVE = "active"
    ENDED = "ended"
    TERMINATED = "terminated"


class Rental(Base):
    __tablename__ = "rentals"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    property_id: Mapped[int] = mapped_column(ForeignKey("properties.id"), index=True)
    tenant_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    landlord_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    status: Mapped[RentalStatus] = mapped_column(
        Enum(RentalStatus), default=RentalStatus.ACTIVE
    )
    monthly_rent: Mapped[int] = mapped_column(Integer)  # TZS
    start_date: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    end_date: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    property = relationship("Property", back_populates="rentals")
    tenant = relationship("User", back_populates="rentals_as_tenant", foreign_keys=[tenant_id])
    landlord = relationship("User", foreign_keys=[landlord_id])
    payments = relationship("RentPayment", back_populates="rental")


class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class RentPayment(Base):
    __tablename__ = "rent_payments"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    rental_id: Mapped[int] = mapped_column(ForeignKey("rentals.id"), index=True)
    amount: Mapped[int] = mapped_column(Integer)  # TZS
    platform_fee: Mapped[int] = mapped_column(Integer)  # 1.5% fee in TZS
    landlord_payout: Mapped[int] = mapped_column(Integer)  # amount - fee
    status: Mapped[PaymentStatus] = mapped_column(
        Enum(PaymentStatus), default=PaymentStatus.PENDING
    )
    mpesa_reference: Mapped[str | None] = mapped_column(String(100), nullable=True)
    payment_month: Mapped[str] = mapped_column(String(7))  # e.g., "2026-03"
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    paid_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    rental = relationship("Rental", back_populates="payments")


class ListingUnlock(Base):
    """Renter pays to unlock landlord contact details for a property."""

    __tablename__ = "listing_unlocks"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    renter_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    property_id: Mapped[int] = mapped_column(ForeignKey("properties.id"), index=True)
    amount_paid: Mapped[int] = mapped_column(Integer)  # TZS
    mpesa_reference: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    renter = relationship("User", back_populates="unlocked_listings")
    property = relationship("Property", back_populates="unlocks")
