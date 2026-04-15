import math
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_landlord
from app.core.config import settings
from app.core.database import get_db
from app.core.rate_limit import enforce_rate_limit
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
from app.services.snippe import SnippeError, create_mobile_payment, get_payment_status, verify_webhook_signature

router = APIRouter(prefix="/rentals", tags=["Rentals & Payments"])


def _normalize_provider_status(value: str | None) -> str:
    return (value or "").strip().lower().replace("-", "_")


def _provider_payment_status(data: dict | None) -> str:
    if not isinstance(data, dict):
        return ""
    return _normalize_provider_status(
        data.get("payment_status") or data.get("status") or data.get("state") or data.get("payment_state")
    )


def _provider_payment_reference(data: dict | None) -> str | None:
    if not isinstance(data, dict):
        return None
    for key in ("external_reference", "transaction_reference", "mpesa_reference", "reference", "id"):
        value = data.get(key)
        if value:
            return str(value)
    return None


def _payment_access_allowed(payment: RentPayment, current_user: User) -> bool:
    if current_user.role == "admin":
        return True
    return payment.rental.tenant_id == current_user.id or payment.rental.landlord_id == current_user.id


def _update_payment_from_provider(payment: RentPayment, provider_data: dict | None, *, fallback_reference: str | None = None):
    provider_status = _provider_payment_status(provider_data)
    provider_reference = _provider_payment_reference(provider_data) or fallback_reference

    if provider_status in {"completed", "success", "successful", "paid"}:
        payment.status = PaymentStatus.COMPLETED
        payment.mpesa_reference = provider_reference
        payment.paid_at = datetime.now(timezone.utc)
        payment.notes = None
    elif provider_status in {"failed", "cancelled", "canceled", "declined", "expired"}:
        payment.status = PaymentStatus.FAILED
        payment.mpesa_reference = provider_reference
        payment.notes = f"Provider status: {provider_status}"
    else:
        payment.status = PaymentStatus.PROCESSING
        if provider_reference:
            payment.mpesa_reference = provider_reference
        payment.notes = f"Provider status: {provider_status or 'processing'}"


def _unlock_state(unlock: ListingUnlock) -> str:
    if not unlock.mpesa_reference:
        return "completed"
    if unlock.mpesa_reference.startswith("pending:"):
        return "pending"
    if unlock.mpesa_reference.startswith("failed:"):
        return "failed"
    return "completed"


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
async def initiate_rent_payment(
    data: RentPaymentCreate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Tenant initiates monthly rent payment via M-Pesa."""
    enforce_rate_limit(request, scope="rentals:initiate_payment", limit=5, window_seconds=300, identifier=str(current_user.id))
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
    if not current_user.email:
        raise HTTPException(
            status_code=400,
            detail="Please add your email in Profile before paying rent",
        )

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

    try:
        provider_payment = await create_mobile_payment(
            amount=payment.amount,
            phone=current_user.phone,
            full_name=current_user.full_name,
            email=current_user.email,
            reference=f"rent-{payment.id}",
            metadata={
                "payment_id": str(payment.id),
                "rental_id": str(rental.id),
                "tenant_id": str(current_user.id),
                "purpose": "rent_payment",
                "callback_url": f"{settings.PUBLIC_BASE_URL}/api/v1/rentals/webhooks/snippe",
            },
        )
    except SnippeError as exc:
        payment.status = PaymentStatus.FAILED
        payment.notes = str(exc)
        db.commit()
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    _update_payment_from_provider(payment, provider_payment, fallback_reference=f"rent-{payment.id}")
    db.commit()
    db.refresh(payment)
    return payment


@router.post("/payments/{payment_id}/confirm", response_model=RentPaymentResponse)
async def confirm_payment(
    payment_id: int,
    mpesa_reference: str,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Confirm M-Pesa payment (webhook or manual confirmation)."""
    enforce_rate_limit(request, scope="rentals:confirm_payment", limit=8, window_seconds=300, identifier=str(current_user.id))
    payment = (
        db.query(RentPayment)
        .join(Rental)
        .filter(RentPayment.id == payment_id)
        .first()
    )
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    if not _payment_access_allowed(payment, current_user):
        raise HTTPException(status_code=403, detail="You do not have access to this payment")
    if payment.status == PaymentStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Payment is already completed")

    normalized_reference = mpesa_reference.strip().upper()
    if not normalized_reference:
        raise HTTPException(status_code=400, detail="M-Pesa reference is required")

    duplicate_reference = db.query(RentPayment).filter(
        RentPayment.id != payment.id,
        RentPayment.mpesa_reference == normalized_reference,
        RentPayment.status == PaymentStatus.COMPLETED,
    ).first()
    if duplicate_reference:
        raise HTTPException(status_code=400, detail="This M-Pesa reference is already in use")

    try:
        provider_payment = await get_payment_status(normalized_reference)
    except SnippeError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Unable to verify payment status right now: {exc}",
        ) from exc

    _update_payment_from_provider(payment, provider_payment, fallback_reference=normalized_reference)
    if payment.status == PaymentStatus.FAILED:
        db.commit()
        raise HTTPException(status_code=400, detail="Payment could not be confirmed. Please try again after completing the mobile money payment.")
    db.commit()
    db.refresh(payment)
    return payment


@router.get("/payments/history", response_model=list[RentPaymentResponse])
def payment_history(
    rental_id: int | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get payment history for a rental or for the current user's rentals."""
    if rental_id is None:
        return (
            db.query(RentPayment)
            .join(Rental)
            .filter(
                (Rental.tenant_id == current_user.id) | (Rental.landlord_id == current_user.id)
            )
            .order_by(RentPayment.created_at.desc())
            .all()
        )

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


@router.get("/unlock/{property_id}", response_model=ListingUnlockResponse)
def get_unlock_status(
    property_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    unlock = db.query(ListingUnlock).filter(
        ListingUnlock.renter_id == current_user.id,
        ListingUnlock.property_id == property_id,
    ).first()
    if not unlock:
        raise HTTPException(status_code=404, detail="Unlock not found")
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    owner = db.query(User).filter(User.id == prop.owner_id).first()
    return _build_unlock_response(
        unlock,
        owner,
        already_unlocked=_unlock_state(unlock) == "completed",
    )


@router.post("/unlock", response_model=ListingUnlockResponse, status_code=201)
async def unlock_listing(
    data: ListingUnlockCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Initiate payment to unlock landlord contact details."""
    if not current_user.email:
        raise HTTPException(
            status_code=400,
            detail="Please add your email in Profile before unlocking contact details",
        )
    prop = db.query(Property).filter(Property.id == data.property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")

    owner = db.query(User).filter(User.id == prop.owner_id).first()
    existing = db.query(ListingUnlock).filter(
        ListingUnlock.renter_id == current_user.id,
        ListingUnlock.property_id == data.property_id,
    ).first()

    if existing and _unlock_state(existing) == "completed":
        return _build_unlock_response(existing, owner, already_unlocked=True)

    if existing and _unlock_state(existing) == "pending":
        return _build_unlock_response(
            existing,
            owner,
            message="Payment is still pending. Approve the prompt on your phone, then refresh shortly.",
        )

    if existing:
        unlock = existing
        unlock.amount_paid = settings.RENTER_UNLOCK_FEE_TZS
    else:
        unlock = ListingUnlock(
            renter_id=current_user.id,
            property_id=data.property_id,
            amount_paid=settings.RENTER_UNLOCK_FEE_TZS,
        )
        db.add(unlock)
        db.commit()
        db.refresh(unlock)

    try:
        payment = await create_mobile_payment(
            amount=unlock.amount_paid,
            phone=current_user.phone,
            full_name=current_user.full_name,
            email=current_user.email,
            reference=f"unlock-{unlock.id}",
            metadata={
                "unlock_id": str(unlock.id),
                "property_id": str(data.property_id),
                "renter_id": str(current_user.id),
                "purpose": "listing_unlock",
                "callback_url": f"{settings.PUBLIC_BASE_URL}/api/v1/rentals/webhooks/snippe",
            },
        )
    except SnippeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    payment_reference = payment.get("reference") or payment.get("id") or f"unlock-{unlock.id}"
    unlock.mpesa_reference = f"pending:{payment_reference}"
    db.commit()
    db.refresh(unlock)

    return _build_unlock_response(
        unlock,
        owner,
        message="Payment initiated. Approve the mobile money prompt on your phone to unlock the landlord contact.",
    )


@router.post("/webhooks/snippe", include_in_schema=False)
async def snippe_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    signature = request.headers.get("X-Webhook-Signature")
    if not verify_webhook_signature(payload, signature):
        raise HTTPException(status_code=401, detail="Invalid webhook signature")

    event = await request.json()
    data = event.get("data", {})
    metadata = data.get("metadata", {})
    unlock_id = metadata.get("unlock_id")
    payment_id = metadata.get("payment_id")
    reference = data.get("reference")
    external_reference = data.get("external_reference")
    event_type = event.get("type")

    payment = None
    if payment_id and str(payment_id).isdigit():
        payment = db.query(RentPayment).filter(RentPayment.id == int(payment_id)).first()

    if payment:
        provider_reference = external_reference or reference or payment.mpesa_reference
        if event_type == "payment.completed":
            payment.status = PaymentStatus.COMPLETED
            payment.mpesa_reference = provider_reference
            payment.paid_at = datetime.now(timezone.utc)
            payment.notes = None
        elif event_type == "payment.failed":
            payment.status = PaymentStatus.FAILED
            payment.mpesa_reference = provider_reference
            payment.notes = f"Provider status: {_provider_payment_status(data) or 'failed'}"
        else:
            payment.status = PaymentStatus.PROCESSING
            if provider_reference:
                payment.mpesa_reference = provider_reference
            payment.notes = f"Provider status: {_provider_payment_status(data) or 'processing'}"
        db.commit()
        return {"received": True}

    unlock = None
    if unlock_id and str(unlock_id).isdigit():
        unlock = db.query(ListingUnlock).filter(ListingUnlock.id == int(unlock_id)).first()
    if not unlock and reference:
        unlock = db.query(ListingUnlock).filter(
            ListingUnlock.mpesa_reference == f"pending:{reference}"
        ).first()
    if not unlock:
        return {"received": True}

    if event_type == "payment.completed":
        unlock.mpesa_reference = external_reference or reference
    elif event_type == "payment.failed":
        unlock.mpesa_reference = f"failed:{reference or external_reference or unlock.id}"
    db.commit()
    return {"received": True}
