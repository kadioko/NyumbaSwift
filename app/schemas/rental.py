from datetime import datetime

from pydantic import BaseModel, field_validator

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

    @field_validator("payment_month")
    @classmethod
    def validate_payment_month(cls, value: str) -> str:
        normalized = value.strip()
        if len(normalized) != 7 or normalized[4] != "-":
            raise ValueError("payment_month must be in YYYY-MM format")
        year, month = normalized.split("-", 1)
        if not year.isdigit() or not month.isdigit():
            raise ValueError("payment_month must be in YYYY-MM format")
        month_number = int(month)
        if month_number < 1 or month_number > 12:
            raise ValueError("payment_month must be in YYYY-MM format")
        return normalized


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
