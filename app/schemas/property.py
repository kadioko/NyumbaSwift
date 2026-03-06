from datetime import datetime

from pydantic import BaseModel

from app.models.property import ListingStatus, PropertyType


class PropertyCreate(BaseModel):
    title: str
    description: str
    property_type: PropertyType
    district: str
    ward: str
    street: str
    latitude: float | None = None
    longitude: float | None = None
    bedrooms: int = 1
    bathrooms: int = 1
    size_sqm: float | None = None
    furnished: bool = False
    has_water: bool = True
    has_electricity: bool = True
    has_parking: bool = False
    has_security: bool = False
    rent_amount: int
    deposit_amount: int | None = None


class PropertyUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    rent_amount: int | None = None
    bedrooms: int | None = None
    bathrooms: int | None = None
    furnished: bool | None = None
    status: ListingStatus | None = None


class PropertyResponse(BaseModel):
    id: int
    owner_id: int
    title: str
    description: str
    property_type: PropertyType
    status: ListingStatus
    district: str
    ward: str
    street: str
    latitude: float | None
    longitude: float | None
    bedrooms: int
    bathrooms: int
    size_sqm: float | None
    furnished: bool
    has_water: bool
    has_electricity: bool
    has_parking: bool
    has_security: bool
    rent_amount: int
    deposit_amount: int | None
    is_premium: bool
    is_verified: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class PropertySearchParams(BaseModel):
    district: str | None = None
    property_type: PropertyType | None = None
    min_rent: int | None = None
    max_rent: int | None = None
    bedrooms: int | None = None
    furnished: bool | None = None


class PropertyListResponse(BaseModel):
    properties: list[PropertyResponse]
    total: int
    page: int
    page_size: int
