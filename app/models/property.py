import enum
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class PropertyType(str, enum.Enum):
    APARTMENT = "apartment"
    HOUSE = "house"
    ROOM = "room"
    STUDIO = "studio"
    COMMERCIAL = "commercial"


class ListingStatus(str, enum.Enum):
    DRAFT = "draft"
    PENDING_VERIFICATION = "pending_verification"
    ACTIVE = "active"
    RENTED = "rented"
    INACTIVE = "inactive"
    REJECTED = "rejected"


class Property(Base):
    __tablename__ = "properties"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text)
    property_type: Mapped[PropertyType] = mapped_column(Enum(PropertyType))
    status: Mapped[ListingStatus] = mapped_column(
        Enum(ListingStatus), default=ListingStatus.DRAFT
    )

    # Location — Dar es Salaam focused
    district: Mapped[str] = mapped_column(String(100))  # e.g., Kinondoni, Ilala, Temeke
    ward: Mapped[str] = mapped_column(String(100))
    street: Mapped[str] = mapped_column(String(255))
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Details
    bedrooms: Mapped[int] = mapped_column(Integer, default=1)
    bathrooms: Mapped[int] = mapped_column(Integer, default=1)
    size_sqm: Mapped[float | None] = mapped_column(Float, nullable=True)
    furnished: Mapped[bool] = mapped_column(Boolean, default=False)
    has_water: Mapped[bool] = mapped_column(Boolean, default=True)
    has_electricity: Mapped[bool] = mapped_column(Boolean, default=True)
    has_parking: Mapped[bool] = mapped_column(Boolean, default=False)
    has_security: Mapped[bool] = mapped_column(Boolean, default=False)

    # Pricing (TZS)
    rent_amount: Mapped[int] = mapped_column(Integer)  # Monthly rent in TZS
    deposit_amount: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Premium listing
    is_premium: Mapped[bool] = mapped_column(Boolean, default=False)
    premium_expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Verification
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    verified_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    owner = relationship("User", back_populates="properties")
    photos = relationship("PropertyPhoto", back_populates="property")
    rentals = relationship("Rental", back_populates="property")
    unlocks = relationship("ListingUnlock", back_populates="property")


class PropertyPhoto(Base):
    __tablename__ = "property_photos"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    property_id: Mapped[int] = mapped_column(ForeignKey("properties.id"), index=True)
    photo_url: Mapped[str] = mapped_column(Text)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    property = relationship("Property", back_populates="photos")
