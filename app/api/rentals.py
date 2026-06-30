import math
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_landlord
from app.api.ntzs_webhooks import process_ntzs_webhook_request
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
from app.models.wallet import TransactionStatus, TransactionType, Wallet, WalletTransaction
from app.schemas.rental import (
    ListingUnlockCreate,
    ListingUnlockResponse,
    RentalCreate,
    RentalResponse,
    RentPaymentCreate,
    RentPaymentResponse,
)
from app.services.ntzs import (
    NTZSError,
    create_mobile_payment,
    create_transfer,
    get_ntzs_user,
    get_payment_status,
)

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


def _build_unlock_response(
    unlock: ListingUnlock,
    owner: User | None,
    *,
    message: str | None = None,
    already_unlocked: bool = False,
) -> ListingUnlockResponse:
    return ListingUnlockResponse(
        id=unlock.id,
        renter_id=unlock.renter_id,
        property_id=unlock.property_id,
        amount_paid=unlock.amount_paid,
        owner_phone=owner.phone if owner else None,
        owner_name=owner.full_name if owner else None,
        payment_status=_unlock_state(unlock),
        payment_reference=unlock.mpesa_reference,
        message=message,
        already_unlocked=already_unlocked,
        created_at=unlock.created_at,
    )


def _get_or_create_wallet(user_id: int, db: Session) -> Wallet:
    wallet = db.query(Wallet).filter(Wallet.user_id == user_id).first()
    if not wallet:
        wallet = Wallet(user_id=user_id, balance_tzs=0)
        db.add(wallet)
        db.commit()
        db.refresh(wallet)
    return wallet


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
    tenant = db.query(User).filter(User.id == data.tenant_id, User.is_active.is_(True)).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    existing_active_rental = db.query(Rental).filter(
        Rental.property_id == data.property_id,
        Rental.status == RentalStatus.ACTIVE,
    ).first()
    if existing_active_rental:
        raise HTTPException(status_code=400, detail="This property already has an active rental")

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
    """Tenant initiates monthly rent payment via nTZS mobile money."""
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
    estimated_platform_fee = math.ceil(amount * settings.RENT_COLLECTION_FEE_PERCENT / 100)
    estimated_landlord_payout = amount - estimated_platform_fee

    payment = RentPayment(
        rental_id=rental.id,
        amount=amount,
        platform_fee=estimated_platform_fee,
        landlord_payout=estimated_landlord_payout,
        payment_month=data.payment_month,
        status=PaymentStatus.PENDING,
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)

    if data.payment_source == "wallet":
        landlord = db.query(User).filter(User.id == rental.landlord_id).first()
        if not landlord or not landlord.email:
            payment.status = PaymentStatus.FAILED
            payment.notes = "Landlord must add an email before wallet payments can be accepted"
            db.commit()
            raise HTTPException(
                status_code=400,
                detail="The landlord must add an email before wallet payments can be accepted.",
            )

        try:
            sender_profile = await get_ntzs_user(
                user_id=current_user.id,
                email=current_user.email,
                full_name=current_user.full_name,
                phone=current_user.phone,
            )
            available_balance = int(sender_profile.get("balanceTzs") or sender_profile.get("balance") or 0)
            if available_balance < payment.amount:
                payment.status = PaymentStatus.FAILED
                payment.notes = "Insufficient wallet balance"
                db.commit()
                raise HTTPException(status_code=400, detail="Insufficient wallet balance. Top up your wallet and try again.")

            transfer_result = await create_transfer(
                from_user_id=current_user.id,
                to_user_id=landlord.id,
                amount=payment.amount,
                sender_email=current_user.email,
                sender_name=current_user.full_name,
                sender_phone=current_user.phone,
                recipient_email=landlord.email,
                recipient_name=landlord.full_name,
                recipient_phone=landlord.phone,
                metadata={
                    "payment_id": str(payment.id),
                    "rental_id": str(rental.id),
                    "payment_month": data.payment_month,
                    "purpose": "rent_payment_wallet",
                },
            )
        except NTZSError as exc:
            payment.status = PaymentStatus.FAILED
            payment.notes = str(exc)
            db.commit()
            raise HTTPException(status_code=502, detail=str(exc)) from exc

        payment.status = PaymentStatus.COMPLETED
        payment.platform_fee = int(transfer_result.get("feeAmountTzs") or estimated_platform_fee)
        payment.landlord_payout = int(transfer_result.get("recipientAmountTzs") or (payment.amount - payment.platform_fee))
        payment.mpesa_reference = str(transfer_result.get("id") or transfer_result.get("txHash") or f"wallet-rent-{payment.id}")
        payment.paid_at = datetime.now(timezone.utc)
        payment.notes = "Paid from NyumbaSwift wallet"

        sender_wallet = _get_or_create_wallet(current_user.id, db)
        landlord_wallet = _get_or_create_wallet(landlord.id, db)
        now = datetime.now(timezone.utc)
        db.add(
            WalletTransaction(
                wallet_id=sender_wallet.id,
                type=TransactionType.TRANSFER_OUT,
                amount=payment.amount,
                status=TransactionStatus.COMPLETED,
                ntzs_reference=str(transfer_result.get("id")),
                peer_wallet_id=landlord_wallet.id,
                description=f"Rent payment for {data.payment_month} on rental #{rental.id}",
                completed_at=now,
            )
        )
        db.add(
            WalletTransaction(
                wallet_id=landlord_wallet.id,
                type=TransactionType.TRANSFER_IN,
                amount=payment.landlord_payout,
                status=TransactionStatus.COMPLETED,
                ntzs_reference=str(transfer_result.get("id")),
                peer_wallet_id=sender_wallet.id,
                description=f"Rent received for {data.payment_month} on rental #{rental.id}",
                completed_at=now,
            )
        )

        refreshed_sender = await get_ntzs_user(
            user_id=current_user.id,
            email=current_user.email,
            full_name=current_user.full_name,
            phone=current_user.phone,
        )
        refreshed_landlord = await get_ntzs_user(
            user_id=landlord.id,
            email=landlord.email,
            full_name=landlord.full_name,
            phone=landlord.phone,
        )
        sender_wallet.balance_tzs = int(refreshed_sender.get("balanceTzs") or refreshed_sender.get("balance") or 0)
        landlord_wallet.balance_tzs = int(refreshed_landlord.get("balanceTzs") or refreshed_landlord.get("balance") or 0)
        db.commit()
        db.refresh(payment)
        return payment

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
                "callback_url": f"{settings.PUBLIC_BASE_URL}/api/v1/ntzs/webhooks",
            },
        )
    except NTZSError as exc:
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
    """Confirm a pending payment, using provider lookup when available."""
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
        raise HTTPException(status_code=400, detail="Payment reference is required")

    duplicate_reference = db.query(RentPayment).filter(
        RentPayment.id != payment.id,
        RentPayment.mpesa_reference == normalized_reference,
        RentPayment.status == PaymentStatus.COMPLETED,
    ).first()
    if duplicate_reference:
        raise HTTPException(status_code=400, detail="This payment reference is already in use")

    try:
        provider_payment = await get_payment_status(normalized_reference)
    except NTZSError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Unable to verify payment status right now: {exc}",
        ) from exc

    _update_payment_from_provider(payment, provider_payment, fallback_reference=normalized_reference)
    if payment.status == PaymentStatus.FAILED:
        db.commit()
        raise HTTPException(
            status_code=400,
            detail="Payment could not be confirmed yet. Complete the mobile money prompt or wait for webhook confirmation.",
        )
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
                "callback_url": f"{settings.PUBLIC_BASE_URL}/api/v1/ntzs/webhooks",
            },
        )
    except NTZSError as exc:
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


@router.post("/webhooks/ntzs", include_in_schema=False)
async def ntzs_webhook(request: Request, db: Session = Depends(get_db)):
    return await process_ntzs_webhook_request(request, db)
