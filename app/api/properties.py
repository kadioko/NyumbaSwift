from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_admin, require_landlord
from app.core.config import settings
from app.core.database import get_db
from app.models.property import ListingStatus, Property, PropertyType
from app.models.user import User
from app.schemas.property import (
    PropertyCreate,
    PropertyListResponse,
    PropertyResponse,
    PropertyUpdate,
)

router = APIRouter(prefix="/properties", tags=["Properties"])

EDITABLE_PROPERTY_FIELDS = {
    "title",
    "description",
    "rent_amount",
    "bedrooms",
    "bathrooms",
    "furnished",
}
STATUS_FIELDS_ALLOWED_FOR_OWNER = {ListingStatus.ACTIVE, ListingStatus.INACTIVE}


@router.post("/", response_model=PropertyResponse, status_code=201)
def create_property(
    data: PropertyCreate,
    current_user: User = Depends(require_landlord),
    db: Session = Depends(get_db),
):
    prop = Property(
        owner_id=current_user.id,
        status=ListingStatus.PENDING_VERIFICATION,
        **data.model_dump(),
    )
    db.add(prop)
    db.commit()
    db.refresh(prop)
    return prop


@router.get("/", response_model=PropertyListResponse)
def list_properties(
    district: str | None = None,
    property_type: PropertyType | None = None,
    min_rent: int | None = None,
    max_rent: int | None = None,
    bedrooms: int | None = None,
    furnished: bool | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Search active listings. Premium listings appear first."""
    query = db.query(Property).filter(Property.status == ListingStatus.ACTIVE)

    if district:
        query = query.filter(Property.district.ilike(f"%{district}%"))
    if property_type:
        query = query.filter(Property.property_type == property_type)
    if min_rent is not None:
        query = query.filter(Property.rent_amount >= min_rent)
    if max_rent is not None:
        query = query.filter(Property.rent_amount <= max_rent)
    if bedrooms is not None:
        query = query.filter(Property.bedrooms >= bedrooms)
    if furnished is not None:
        query = query.filter(Property.furnished == furnished)

    total = query.count()
    properties = (
        query.order_by(Property.is_premium.desc(), Property.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return PropertyListResponse(
        properties=properties, total=total, page=page, page_size=page_size
    )


@router.get("/{property_id}", response_model=PropertyResponse)
def get_property(property_id: int, db: Session = Depends(get_db)):
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    return prop


@router.patch("/{property_id}", response_model=PropertyResponse)
def update_property(
    property_id: int,
    data: PropertyUpdate,
    current_user: User = Depends(require_landlord),
    db: Session = Depends(get_db),
):
    prop = db.query(Property).filter(
        Property.id == property_id, Property.owner_id == current_user.id
    ).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found or not owned by you")

    updates = data.model_dump(exclude_unset=True)
    requested_status = updates.pop("status", None)

    if requested_status is not None:
        if requested_status not in STATUS_FIELDS_ALLOWED_FOR_OWNER:
            raise HTTPException(status_code=400, detail="You can only switch a listing between active and inactive")
        if requested_status == ListingStatus.ACTIVE and not prop.is_verified:
            raise HTTPException(status_code=400, detail="Only verified listings can be activated")
        prop.status = requested_status

    for field, value in updates.items():
        setattr(prop, field, value)

    if updates and any(field in EDITABLE_PROPERTY_FIELDS for field in updates):
        prop.is_verified = False
        prop.verified_at = None
        prop.status = ListingStatus.PENDING_VERIFICATION

    db.commit()
    db.refresh(prop)
    return prop


@router.post("/{property_id}/verify", response_model=PropertyResponse)
def verify_property(
    property_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Admin verifies a property listing."""
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    if prop.status == ListingStatus.RENTED:
        raise HTTPException(status_code=400, detail="Rented properties cannot be verified")
    prop.is_verified = True
    prop.verified_at = datetime.now(timezone.utc)
    prop.status = ListingStatus.ACTIVE
    db.commit()
    db.refresh(prop)
    return prop


@router.post("/{property_id}/boost", response_model=PropertyResponse)
def boost_property(
    property_id: int,
    current_user: User = Depends(require_landlord),
    db: Session = Depends(get_db),
):
    """Upgrade to premium listing (payment handled separately)."""
    prop = db.query(Property).filter(
        Property.id == property_id, Property.owner_id == current_user.id
    ).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found or not owned by you")
    if not prop.is_verified or prop.status != ListingStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="Only active verified listings can be boosted")
    prop.is_premium = True
    prop.premium_expires_at = datetime.now(timezone.utc) + timedelta(days=30)
    db.commit()
    db.refresh(prop)
    return prop


@router.get("/my/listings", response_model=PropertyListResponse)
def my_listings(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_landlord),
    db: Session = Depends(get_db),
):
    """Landlord's own properties."""
    query = db.query(Property).filter(Property.owner_id == current_user.id)
    total = query.count()
    properties = (
        query.order_by(Property.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return PropertyListResponse(
        properties=properties, total=total, page=page, page_size=page_size
    )
