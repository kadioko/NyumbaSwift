from datetime import datetime

from pydantic import BaseModel

from app.models.rental import PaymentStatus, RentalStatus


class RentalCreate(BaseModel):
    property_id: int
    tenant_id: int
    monthly_rent: int
    start_date: datetime
    end_date: datetime | None = None


class RentalResponse(BaseModel):
    id: int
    property_id: int
    tenant_id: int
    landlord_id: int
    status: RentalStatus
    monthly_rent: int
    start_date: datetime
    end_date: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class RentPaymentCreate(BaseModel):
    rental_id: int
    payment_month: str  # "2026-03"


class RentPaymentResponse(BaseModel):
    id: int
    rental_id: int
    amount: int
    platform_fee: int
    landlord_payout: int
    status: PaymentStatus
    mpesa_reference: str | None
    payment_month: str
    paid_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class ListingUnlockCreate(BaseModel):
    property_id: int


class ListingUnlockResponse(BaseModel):
    id: int
    renter_id: int
    property_id: int
    amount_paid: int
    owner_phone: str | None = None
    owner_name: str | None = None
    payment_status: str = "completed"
    payment_reference: str | None = None
    message: str | None = None
    already_unlocked: bool = False
    created_at: datetime

    model_config = {"from_attributes": True}
