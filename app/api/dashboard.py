from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_admin, require_landlord
from app.core.database import get_db
from app.models.property import ListingStatus, Property
from app.models.rental import PaymentStatus, RentPayment, Rental, RentalStatus
from app.models.user import User

router = APIRouter(prefix="/dashboard", tags=["Property Management Dashboard"])


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

    return {
        "total_properties": total_properties,
        "active_listings": active_listings,
        "active_rentals": active_rentals,
        "total_rent_collected_tzs": total_rent_collected,
        "total_platform_fees_tzs": total_platform_fees,
        "pending_payments": pending_payments,
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
    for prop in properties:
        active_rental = db.query(Rental).filter(
            Rental.property_id == prop.id,
            Rental.status == RentalStatus.ACTIVE,
        ).first()

        tenant_info = None
        if active_rental:
            tenant = db.query(User).filter(User.id == active_rental.tenant_id).first()
            tenant_info = {
                "id": tenant.id,
                "name": tenant.full_name,
                "phone": tenant.phone,
                "rental_start": active_rental.start_date.isoformat(),
                "monthly_rent": active_rental.monthly_rent,
            }

        result.append({
            "property_id": prop.id,
            "title": prop.title,
            "district": prop.district,
            "status": prop.status.value,
            "rent_amount": prop.rent_amount,
            "is_verified": prop.is_verified,
            "is_premium": prop.is_premium,
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
