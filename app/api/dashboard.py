from calendar import monthrange
from datetime import UTC, date, datetime
from urllib.parse import quote

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_admin, require_landlord
from app.core.database import get_db
from app.models.property import ListingStatus, Property
from app.models.rental import PaymentStatus, RentPayment, Rental, RentalStatus
from app.models.user import User
from app.models.wallet import Wallet

router = APIRouter(prefix="/dashboard", tags=["Property Management Dashboard"])


def _get_or_create_wallet(user_id: int, db: Session) -> Wallet:
    wallet = db.query(Wallet).filter(Wallet.user_id == user_id).first()
    if not wallet:
        wallet = Wallet(user_id=user_id, balance_tzs=0)
        db.add(wallet)
        db.commit()
        db.refresh(wallet)
    return wallet


def _safe_due_date(year: int, month: int, day: int) -> date:
    return date(year, month, min(day, monthrange(year, month)[1]))


def _iter_due_schedule(start_at: datetime, today: date) -> list[date]:
    if start_at.tzinfo is None:
        start_at = start_at.replace(tzinfo=None)

    start_date = start_at.date()
    due_dates: list[date] = []
    year = start_date.year
    month = start_date.month
    day = start_date.day

    while True:
        due_date = _safe_due_date(year, month, day)
        if due_date > today:
            break
        due_dates.append(due_date)
        if month == 12:
            year += 1
            month = 1
        else:
            month += 1

    return due_dates


def _month_label(value: date) -> str:
    return value.strftime("%Y-%m")


def _next_due_date_for_rental(rental: Rental, today: date) -> date:
    current_month_due = _safe_due_date(today.year, today.month, rental.start_date.day)
    if current_month_due > today:
        return current_month_due
    if today.month == 12:
        return _safe_due_date(today.year + 1, 1, rental.start_date.day)
    return _safe_due_date(today.year, today.month + 1, rental.start_date.day)


def _build_whatsapp_link(
    *,
    tenant: User,
    landlord: User,
    property_title: str,
    monthly_rent: int,
    due_months: list[str],
    total_due_tzs: int,
    days_overdue: int,
) -> str | None:
    digits = "".join(ch for ch in (tenant.phone or "") if ch.isdigit())
    if not digits:
        return None
    if digits.startswith("0"):
        digits = f"255{digits[1:]}"
    if digits.startswith("255") and len(digits) >= 12:
        phone = digits
    else:
        phone = digits

    if not phone:
        return None

    due_months_text = ", ".join(due_months) if due_months else "this month"
    overdue_line = (
        f"You are currently overdue by {days_overdue} day{'s' if days_overdue != 1 else ''}."
        if days_overdue > 0
        else "Your rent is now due."
    )
    message = (
        f"Hello {tenant.full_name}, this is a rent reminder from {landlord.full_name} via NyumbaSwift.\n"
        f"Property: {property_title}\n"
        f"Monthly rent: TZS {monthly_rent:,}\n"
        f"Due months: {due_months_text}\n"
        f"Total due: TZS {total_due_tzs:,}\n"
        f"{overdue_line}\n"
        "Please clear your rent on NyumbaSwift using wallet balance or mobile money. Thank you."
    )
    return f"https://wa.me/{phone}?text={quote(message)}"


def _build_rent_status(rental: Rental) -> dict:
    today = datetime.now(UTC).date()
    due_schedule = _iter_due_schedule(rental.start_date, today)
    paid_months = {
        payment.payment_month
        for payment in rental.payments
        if payment.status == PaymentStatus.COMPLETED
    }
    due_month_dates = [due_date for due_date in due_schedule if _month_label(due_date) not in paid_months]
    due_months = [_month_label(due_date) for due_date in due_month_dates]
    total_due_tzs = len(due_months) * rental.monthly_rent
    first_due_date = due_month_dates[0] if due_month_dates else None
    next_due_date = due_month_dates[0] if due_month_dates else _next_due_date_for_rental(rental, today)
    last_paid_month = max(paid_months) if paid_months else None

    return {
        "has_balance_due": bool(due_months),
        "due_months": due_months,
        "months_due": len(due_months),
        "days_overdue": (today - first_due_date).days if first_due_date else 0,
        "total_due_tzs": total_due_tzs,
        "current_due_month": due_months[-1] if due_months else None,
        "last_paid_month": last_paid_month,
        "next_due_date": next_due_date.isoformat(),
    }


@router.get("/landlord/summary")
def landlord_summary(
    current_user: User = Depends(require_landlord),
    db: Session = Depends(get_db),
):
    """Landlord property management dashboard summary."""
    total_properties = db.query(Property).filter(
        Property.owner_id == current_user.id
    ).count()

    active_listings = db.query(Property).filter(
        Property.owner_id == current_user.id,
        Property.status == ListingStatus.ACTIVE,
    ).count()

    active_rentals = db.query(Rental).filter(
        Rental.landlord_id == current_user.id,
        Rental.status == RentalStatus.ACTIVE,
    ).count()

    total_rent_collected = (
        db.query(func.coalesce(func.sum(RentPayment.landlord_payout), 0))
        .join(Rental)
        .filter(
            Rental.landlord_id == current_user.id,
            RentPayment.status == PaymentStatus.COMPLETED,
        )
        .scalar()
    )

    total_platform_fees = (
        db.query(func.coalesce(func.sum(RentPayment.platform_fee), 0))
        .join(Rental)
        .filter(
            Rental.landlord_id == current_user.id,
            RentPayment.status == PaymentStatus.COMPLETED,
        )
        .scalar()
    )

    pending_payments = (
        db.query(func.count(RentPayment.id))
        .join(Rental)
        .filter(
            Rental.landlord_id == current_user.id,
            RentPayment.status == PaymentStatus.PENDING,
        )
        .scalar()
    )

    wallet = _get_or_create_wallet(current_user.id, db)
    active_rental_rows = (
        db.query(Rental)
        .filter(
            Rental.landlord_id == current_user.id,
            Rental.status == RentalStatus.ACTIVE,
        )
        .all()
    )
    rent_statuses = [_build_rent_status(rental) for rental in active_rental_rows]

    return {
        "total_properties": total_properties,
        "active_listings": active_listings,
        "active_rentals": active_rentals,
        "total_rent_collected_tzs": total_rent_collected,
        "total_platform_fees_tzs": total_platform_fees,
        "pending_payments": pending_payments,
        "wallet_id": wallet.id,
        "wallet_balance_tzs": wallet.balance_tzs,
        "wallet_ready": bool(current_user.email),
        "wallet_status_message": (
            "Ready to receive rent into your wallet."
            if current_user.email
            else "Add your email in Profile to receive wallet rent and payouts."
        ),
        "tenants_due_now": sum(1 for status in rent_statuses if status["has_balance_due"]),
        "overdue_rentals": sum(1 for status in rent_statuses if status["days_overdue"] > 0),
        "total_due_tzs": sum(status["total_due_tzs"] for status in rent_statuses),
    }


@router.get("/landlord/properties")
def landlord_properties(
    current_user: User = Depends(require_landlord),
    db: Session = Depends(get_db),
):
    """Detailed view of landlord's properties with rental status."""
    properties = db.query(Property).filter(
        Property.owner_id == current_user.id
    ).all()

    result = []
    wallet_ready = bool(current_user.email)
    wallet_status_message = (
        "Ready to receive rent in your wallet."
        if wallet_ready
        else "Add your email in Profile to receive wallet rent automatically."
    )
    for prop in properties:
        active_rental = db.query(Rental).filter(
            Rental.property_id == prop.id,
            Rental.status == RentalStatus.ACTIVE,
        ).first()

        tenant_info = None
        if active_rental:
            tenant = db.query(User).filter(User.id == active_rental.tenant_id).first()
            rent_status = _build_rent_status(active_rental)
            tenant_info = {
                "id": tenant.id,
                "name": tenant.full_name,
                "phone": tenant.phone,
                "rental_start": active_rental.start_date.isoformat(),
                "monthly_rent": active_rental.monthly_rent,
                "rent_status": rent_status,
                "whatsapp_url": _build_whatsapp_link(
                    tenant=tenant,
                    landlord=current_user,
                    property_title=prop.title,
                    monthly_rent=active_rental.monthly_rent,
                    due_months=rent_status["due_months"],
                    total_due_tzs=rent_status["total_due_tzs"],
                    days_overdue=rent_status["days_overdue"],
                ),
            }

        result.append({
            "property_id": prop.id,
            "title": prop.title,
            "district": prop.district,
            "status": prop.status.value,
            "rent_amount": prop.rent_amount,
            "is_verified": prop.is_verified,
            "is_premium": prop.is_premium,
            "wallet_receive_ready": wallet_ready,
            "wallet_status_message": wallet_status_message,
            "current_tenant": tenant_info,
        })

    return result


@router.get("/admin/platform-stats")
def platform_stats(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Platform-wide stats for admin/overview."""
    from app.models.rental import ListingUnlock

    total_properties = db.query(Property).count()
    active_listings = db.query(Property).filter(
        Property.status == ListingStatus.ACTIVE
    ).count()
    total_rentals = db.query(Rental).filter(
        Rental.status == RentalStatus.ACTIVE
    ).count()

    total_rent_processed = (
        db.query(func.coalesce(func.sum(RentPayment.amount), 0))
        .filter(RentPayment.status == PaymentStatus.COMPLETED)
        .scalar()
    )
    total_platform_revenue = (
        db.query(func.coalesce(func.sum(RentPayment.platform_fee), 0))
        .filter(RentPayment.status == PaymentStatus.COMPLETED)
        .scalar()
    )
    total_unlock_revenue = (
        db.query(func.coalesce(func.sum(ListingUnlock.amount_paid), 0)).scalar()
    )

    return {
        "total_properties": total_properties,
        "active_listings": active_listings,
        "active_rentals": total_rentals,
        "total_rent_processed_tzs": total_rent_processed,
        "platform_rent_fees_tzs": total_platform_revenue,
        "unlock_fees_revenue_tzs": total_unlock_revenue,
        "total_platform_revenue_tzs": total_platform_revenue + total_unlock_revenue,
    }
