import math
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_landlord
from app.core.config import settings
from app.core.database import get_db
from app.models.property import Property
from app.models.rental import (
    ListingUnlock,
    PaymentStatus,
    RentPayment,
    Rental,
    RentalStatus,
)
from app.models.user import User
from app.schemas.rental import (
    ListingUnlockCreate,
    ListingUnlockResponse,
    RentalCreate,
    RentalResponse,
    RentPaymentCreate,
    RentPaymentResponse,
)

router = APIRouter(prefix="/rentals", tags=["Rentals & Payments"])


# --- Rental Management ---


@router.post("/", response_model=RentalResponse, status_code=201)
def create_rental(
    data: RentalCreate,
    current_user: User = Depends(require_landlord),
    db: Session = Depends(get_db),
):
    """Landlord creates a rental agreement for a tenant."""
    prop = db.query(Property).filter(
        Property.id == data.property_id, Property.owner_id == current_user.id
    ).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found or not owned by you")

    rental = Rental(
        property_id=data.property_id,
        tenant_id=data.tenant_id,
        landlord_id=current_user.id,
        monthly_rent=data.monthly_rent,
        start_date=data.start_date,
        end_date=data.end_date,
    )
    db.add(rental)
    db.commit()
    db.refresh(rental)
    return rental


@router.get("/my", response_model=list[RentalResponse])
def my_rentals(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get rentals — as tenant or landlord."""
    rentals = db.query(Rental).filter(
        (Rental.tenant_id == current_user.id) | (Rental.landlord_id == current_user.id)
    ).all()
    return rentals


@router.post("/{rental_id}/end", response_model=RentalResponse)
def end_rental(
    rental_id: int,
    current_user: User = Depends(require_landlord),
    db: Session = Depends(get_db),
):
    rental = db.query(Rental).filter(
        Rental.id == rental_id, Rental.landlord_id == current_user.id
    ).first()
    if not rental:
        raise HTTPException(status_code=404, detail="Rental not found")
    rental.status = RentalStatus.ENDED
    rental.end_date = datetime.now(timezone.utc)
    db.commit()
    db.refresh(rental)
    return rental


# --- Rent Payments (Digital Rent Collection) ---


@router.post("/payments", response_model=RentPaymentResponse, status_code=201)
def initiate_rent_payment(
    data: RentPaymentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Tenant initiates monthly rent payment via M-Pesa."""
    rental = db.query(Rental).filter(
        Rental.id == data.rental_id, Rental.tenant_id == current_user.id
    ).first()
    if not rental:
        raise HTTPException(status_code=404, detail="Rental not found")
    if rental.status != RentalStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="Rental is not active")

    # Check for duplicate payment in same month
    existing = db.query(RentPayment).filter(
        RentPayment.rental_id == rental.id,
        RentPayment.payment_month == data.payment_month,
        RentPayment.status.in_([PaymentStatus.PENDING, PaymentStatus.COMPLETED, PaymentStatus.PROCESSING]),
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Payment already exists for this month")

    amount = rental.monthly_rent
    platform_fee = math.ceil(amount * settings.RENT_COLLECTION_FEE_PERCENT / 100)
    landlord_payout = amount - platform_fee

    payment = RentPayment(
        rental_id=rental.id,
        amount=amount,
        platform_fee=platform_fee,
        landlord_payout=landlord_payout,
        payment_month=data.payment_month,
        status=PaymentStatus.PENDING,
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment


@router.post("/payments/{payment_id}/confirm", response_model=RentPaymentResponse)
def confirm_payment(
    payment_id: int,
    mpesa_reference: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Confirm M-Pesa payment (webhook or manual confirmation)."""
    payment = db.query(RentPayment).filter(RentPayment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    payment.status = PaymentStatus.COMPLETED
    payment.mpesa_reference = mpesa_reference
    payment.paid_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(payment)
    return payment


@router.get("/payments/history", response_model=list[RentPaymentResponse])
def payment_history(
    rental_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get payment history for a rental."""
    rental = db.query(Rental).filter(
        Rental.id == rental_id,
        (Rental.tenant_id == current_user.id) | (Rental.landlord_id == current_user.id),
    ).first()
    if not rental:
        raise HTTPException(status_code=404, detail="Rental not found")
    return (
        db.query(RentPayment)
        .filter(RentPayment.rental_id == rental_id)
        .order_by(RentPayment.created_at.desc())
        .all()
    )


# --- Listing Unlock (Renter pays to see landlord contact) ---


@router.post("/unlock", status_code=201)
def unlock_listing(
    data: ListingUnlockCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Renter pays to unlock landlord contact details."""
    # Check if already unlocked
    existing = db.query(ListingUnlock).filter(
        ListingUnlock.renter_id == current_user.id,
        ListingUnlock.property_id == data.property_id,
    ).first()
    if existing:
        prop = db.query(Property).filter(Property.id == data.property_id).first()
        owner = db.query(User).filter(User.id == prop.owner_id).first()
        return {
            "id": existing.id,
            "renter_id": existing.renter_id,
            "property_id": existing.property_id,
            "amount_paid": existing.amount_paid,
            "owner_phone": owner.phone,
            "owner_name": owner.full_name,
            "created_at": existing.created_at,
            "already_unlocked": True,
        }

    prop = db.query(Property).filter(Property.id == data.property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")

    unlock = ListingUnlock(
        renter_id=current_user.id,
        property_id=data.property_id,
        amount_paid=settings.RENTER_UNLOCK_FEE_TZS,
    )
    db.add(unlock)
    db.commit()
    db.refresh(unlock)

    owner = db.query(User).filter(User.id == prop.owner_id).first()
    return {
        "id": unlock.id,
        "renter_id": unlock.renter_id,
        "property_id": unlock.property_id,
        "amount_paid": unlock.amount_paid,
        "owner_phone": owner.phone,
        "owner_name": owner.full_name,
        "created_at": unlock.created_at,
    }
