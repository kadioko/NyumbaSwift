from datetime import datetime, timedelta, timezone

from app.core.database import Base, SessionLocal, engine
from app.core.security import hash_password
from app.models.agent import AgentProfile, AgentStatus
from app.models.property import ListingStatus, Property, PropertyPhoto, PropertyType
from app.models.rental import ListingUnlock, PaymentStatus, RentPayment, Rental, RentalStatus
from app.models.user import User, UserRole, VerificationStatus

PASSWORD = "testpass123"
NOW = datetime.now(timezone.utc)

USER_SEEDS = [
    {
        "phone": "0711000001",
        "full_name": "Amina Admin",
        "email": "admin.testing@nyumbaswift.local",
        "role": UserRole.ADMIN,
        "verification_status": VerificationStatus.VERIFIED,
        "national_id": "TZ-ADMIN-0001",
        "profile_photo_url": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80",
    },
    {
        "phone": "0711000002",
        "full_name": "Lydia Landlord",
        "email": "lydia.landlord@nyumbaswift.local",
        "role": UserRole.LANDLORD,
        "verification_status": VerificationStatus.VERIFIED,
        "national_id": "TZ-LANDLORD-0002",
        "profile_photo_url": "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&q=80",
    },
    {
        "phone": "0711000003",
        "full_name": "Musa Landlord",
        "email": "musa.landlord@nyumbaswift.local",
        "role": UserRole.LANDLORD,
        "verification_status": VerificationStatus.VERIFIED,
        "national_id": "TZ-LANDLORD-0003",
        "profile_photo_url": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
    },
    {
        "phone": "0711000004",
        "full_name": "Neema Agent",
        "email": "neema.agent@nyumbaswift.local",
        "role": UserRole.AGENT,
        "verification_status": VerificationStatus.VERIFIED,
        "national_id": "TZ-AGENT-0004",
        "profile_photo_url": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80",
    },
    {
        "phone": "0711000005",
        "full_name": "Kelvin Agent",
        "email": "kelvin.agent@nyumbaswift.local",
        "role": UserRole.AGENT,
        "verification_status": VerificationStatus.VERIFIED,
        "national_id": "TZ-AGENT-0005",
        "profile_photo_url": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80",
    },
    {
        "phone": "0711000006",
        "full_name": "Rehema Renter",
        "email": "rehema.renter@nyumbaswift.local",
        "role": UserRole.RENTER,
        "verification_status": VerificationStatus.VERIFIED,
        "national_id": "TZ-RENTER-0006",
        "profile_photo_url": "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=400&q=80",
    },
    {
        "phone": "0711000007",
        "full_name": "Juma Renter",
        "email": "juma.renter@nyumbaswift.local",
        "role": UserRole.RENTER,
        "verification_status": VerificationStatus.VERIFIED,
        "national_id": "TZ-RENTER-0007",
        "profile_photo_url": "https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=400&q=80",
    },
    {
        "phone": "0711000008",
        "full_name": "Zawadi Broker",
        "email": "zawadi.broker@nyumbaswift.local",
        "role": UserRole.AGENT,
        "verification_status": VerificationStatus.PENDING,
        "national_id": "TZ-BROKER-0008",
        "profile_photo_url": "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80",
    },
]

PROPERTY_SEEDS = [
    {
        "key": "kinondoni-apartment",
        "owner_phone": "0711000002",
        "title": "2BR Furnished Apartment in Mikocheni",
        "description": "Bright furnished apartment with parking, security, and water storage near the main road.",
        "property_type": PropertyType.APARTMENT,
        "status": ListingStatus.ACTIVE,
        "district": "Kinondoni",
        "ward": "Mikocheni",
        "street": "Rose Garden Street",
        "latitude": -6.7712,
        "longitude": 39.2421,
        "bedrooms": 2,
        "bathrooms": 2,
        "size_sqm": 92.0,
        "furnished": True,
        "has_water": True,
        "has_electricity": True,
        "has_parking": True,
        "has_security": True,
        "rent_amount": 850000,
        "deposit_amount": 850000,
        "is_premium": True,
        "premium_expires_at": NOW + timedelta(days=45),
        "is_verified": True,
        "verified_at": NOW - timedelta(days=12),
        "photos": [
            "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80",
        ],
    },
    {
        "key": "ilala-studio",
        "owner_phone": "0711000002",
        "title": "Modern Studio near Kariakoo",
        "description": "Compact studio ideal for young professionals with reliable electricity and easy commute access.",
        "property_type": PropertyType.STUDIO,
        "status": ListingStatus.ACTIVE,
        "district": "Ilala",
        "ward": "Kariakoo",
        "street": "Uhuru Lane",
        "latitude": -6.8176,
        "longitude": 39.2804,
        "bedrooms": 1,
        "bathrooms": 1,
        "size_sqm": 38.0,
        "furnished": False,
        "has_water": True,
        "has_electricity": True,
        "has_parking": False,
        "has_security": True,
        "rent_amount": 420000,
        "deposit_amount": 420000,
        "is_premium": False,
        "premium_expires_at": None,
        "is_verified": True,
        "verified_at": NOW - timedelta(days=7),
        "photos": [
            "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80",
        ],
    },
    {
        "key": "temeke-house",
        "owner_phone": "0711000003",
        "title": "3BR Family House in Temeke",
        "description": "Spacious compound house with parking and dependable water supply for a growing family.",
        "property_type": PropertyType.HOUSE,
        "status": ListingStatus.ACTIVE,
        "district": "Temeke",
        "ward": "Chang\u2019ombe",
        "street": "Kijichi Road",
        "latitude": -6.8924,
        "longitude": 39.2557,
        "bedrooms": 3,
        "bathrooms": 2,
        "size_sqm": 145.0,
        "furnished": False,
        "has_water": True,
        "has_electricity": True,
        "has_parking": True,
        "has_security": False,
        "rent_amount": 650000,
        "deposit_amount": 650000,
        "is_premium": True,
        "premium_expires_at": NOW + timedelta(days=20),
        "is_verified": True,
        "verified_at": NOW - timedelta(days=4),
        "photos": [
            "https://images.unsplash.com/photo-1560185007-cde436f6a4d0?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=1200&q=80",
        ],
    },
    {
        "key": "ubungo-room",
        "owner_phone": "0711000003",
        "title": "Affordable Ensuite Room in Ubungo",
        "description": "Clean private room with ensuite bathroom, prepaid power, and fast access to main transport routes.",
        "property_type": PropertyType.ROOM,
        "status": ListingStatus.ACTIVE,
        "district": "Ubungo",
        "ward": "Sinza",
        "street": "Mori Road",
        "latitude": -6.7835,
        "longitude": 39.2234,
        "bedrooms": 1,
        "bathrooms": 1,
        "size_sqm": 22.0,
        "furnished": True,
        "has_water": True,
        "has_electricity": True,
        "has_parking": False,
        "has_security": True,
        "rent_amount": 260000,
        "deposit_amount": 260000,
        "is_premium": False,
        "premium_expires_at": None,
        "is_verified": True,
        "verified_at": NOW - timedelta(days=9),
        "photos": [
            "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80&sat=-20",
        ],
    },
    {
        "key": "masaki-apartment",
        "owner_phone": "0711000002",
        "title": "Executive 3BR Apartment in Masaki",
        "description": "Premium apartment with balcony views, backup water, covered parking, and 24/7 security.",
        "property_type": PropertyType.APARTMENT,
        "status": ListingStatus.ACTIVE,
        "district": "Kinondoni",
        "ward": "Msasani",
        "street": "Chole Road",
        "latitude": -6.7461,
        "longitude": 39.2833,
        "bedrooms": 3,
        "bathrooms": 3,
        "size_sqm": 165.0,
        "furnished": True,
        "has_water": True,
        "has_electricity": True,
        "has_parking": True,
        "has_security": True,
        "rent_amount": 1800000,
        "deposit_amount": 1800000,
        "is_premium": True,
        "premium_expires_at": NOW + timedelta(days=60),
        "is_verified": True,
        "verified_at": NOW - timedelta(days=15),
        "photos": [
            "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1502672023488-70e25813eb80?auto=format&fit=crop&w=1200&q=80",
        ],
    },
    {
        "key": "kigamboni-house",
        "owner_phone": "0711000003",
        "title": "Beachside 4BR House in Kigamboni",
        "description": "Large family home with garden space, secure parking, and airy living areas near the beach corridor.",
        "property_type": PropertyType.HOUSE,
        "status": ListingStatus.ACTIVE,
        "district": "Kigamboni",
        "ward": "Kibada",
        "street": "Bahari Drive",
        "latitude": -6.8471,
        "longitude": 39.3632,
        "bedrooms": 4,
        "bathrooms": 3,
        "size_sqm": 210.0,
        "furnished": False,
        "has_water": True,
        "has_electricity": True,
        "has_parking": True,
        "has_security": True,
        "rent_amount": 1250000,
        "deposit_amount": 1250000,
        "is_premium": True,
        "premium_expires_at": NOW + timedelta(days=35),
        "is_verified": True,
        "verified_at": NOW - timedelta(days=6),
        "photos": [
            "https://images.unsplash.com/photo-1576941089067-2de3c901e126?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
        ],
    },
    {
        "key": "ilala-commercial",
        "owner_phone": "0711000002",
        "title": "Street Front Commercial Space in Ilala",
        "description": "Visible commercial unit suitable for salon, boutique, or service office with steady foot traffic.",
        "property_type": PropertyType.COMMERCIAL,
        "status": ListingStatus.ACTIVE,
        "district": "Ilala",
        "ward": "Upanga",
        "street": "Jamhuri Street",
        "latitude": -6.8075,
        "longitude": 39.2861,
        "bedrooms": 0,
        "bathrooms": 1,
        "size_sqm": 58.0,
        "furnished": False,
        "has_water": True,
        "has_electricity": True,
        "has_parking": True,
        "has_security": True,
        "rent_amount": 900000,
        "deposit_amount": 900000,
        "is_premium": False,
        "premium_expires_at": None,
        "is_verified": True,
        "verified_at": NOW - timedelta(days=8),
        "photos": [
            "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1497215842964-222b430dc094?auto=format&fit=crop&w=1200&q=80",
        ],
    },
    {
        "key": "mbezi-studio",
        "owner_phone": "0711000003",
        "title": "New Studio Apartment in Mbezi Beach",
        "description": "Freshly finished studio with tiled floors, secure gate, and reliable water near shopping and beach access.",
        "property_type": PropertyType.STUDIO,
        "status": ListingStatus.ACTIVE,
        "district": "Kinondoni",
        "ward": "Kawe",
        "street": "Mbezi Mwisho Lane",
        "latitude": -6.7008,
        "longitude": 39.2074,
        "bedrooms": 1,
        "bathrooms": 1,
        "size_sqm": 34.0,
        "furnished": False,
        "has_water": True,
        "has_electricity": True,
        "has_parking": True,
        "has_security": True,
        "rent_amount": 380000,
        "deposit_amount": 380000,
        "is_premium": False,
        "premium_expires_at": None,
        "is_verified": True,
        "verified_at": NOW - timedelta(days=5),
        "photos": [
            "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80",
        ],
    },
]

AGENT_SEEDS = [
    {
        "phone": "0711000004",
        "status": AgentStatus.APPROVED,
        "business_name": "Neema Homes Advisory",
        "license_number": "AGT-DSM-2041",
        "bio": "Specializes in verified apartment placements across Kinondoni and Ilala.",
        "operating_districts": "Kinondoni,Ilala",
        "commission_rate": 8.5,
        "total_listings": 12,
        "total_rentals_facilitated": 18,
        "rating": 4.8,
        "approved_at": NOW - timedelta(days=30),
    },
    {
        "phone": "0711000005",
        "status": AgentStatus.APPROVED,
        "business_name": "Kelvin Rentals Desk",
        "license_number": "AGT-DSM-3177",
        "bio": "Handles family homes and premium listings in Temeke and Ubungo.",
        "operating_districts": "Temeke,Ubungo",
        "commission_rate": 9.0,
        "total_listings": 8,
        "total_rentals_facilitated": 11,
        "rating": 4.6,
        "approved_at": NOW - timedelta(days=18),
    },
    {
        "phone": "0711000008",
        "status": AgentStatus.PENDING,
        "business_name": "Zawadi Property Connect",
        "license_number": "AGT-DSM-4020",
        "bio": "New broker application waiting for approval.",
        "operating_districts": "Kinondoni,Temeke",
        "commission_rate": 10.0,
        "total_listings": 1,
        "total_rentals_facilitated": 0,
        "rating": 0.0,
        "approved_at": None,
    },
]

RENTAL_SEEDS = [
    {
        "property_key": "kinondoni-apartment",
        "tenant_phone": "0711000006",
        "status": RentalStatus.ACTIVE,
        "monthly_rent": 850000,
        "start_date": NOW - timedelta(days=50),
        "end_date": None,
        "payment_month": NOW.strftime("%Y-%m"),
        "payment_status": PaymentStatus.COMPLETED,
        "mpesa_reference": "TESTPAY-850001",
        "unlock_phone": "0711000007",
        "unlock_amount": 15000,
        "unlock_reference": "UNLOCK-15001",
    },
    {
        "property_key": "temeke-house",
        "tenant_phone": "0711000007",
        "status": RentalStatus.ACTIVE,
        "monthly_rent": 650000,
        "start_date": NOW - timedelta(days=20),
        "end_date": None,
        "payment_month": NOW.strftime("%Y-%m"),
        "payment_status": PaymentStatus.PENDING,
        "mpesa_reference": None,
        "unlock_phone": "0711000006",
        "unlock_amount": 15000,
        "unlock_reference": None,
    },
]


def get_or_create_user(db, seed):
    user = db.query(User).filter(User.phone == seed["phone"]).first()
    if not user:
        user = User(phone=seed["phone"], hashed_password=hash_password(PASSWORD))
        db.add(user)
    user.full_name = seed["full_name"]
    user.email = seed["email"]
    user.role = seed["role"]
    user.verification_status = seed["verification_status"]
    user.national_id = seed["national_id"]
    user.profile_photo_url = seed["profile_photo_url"]
    user.is_active = True
    db.flush()
    return user


def get_or_create_agent_profile(db, user, seed):
    profile = db.query(AgentProfile).filter(AgentProfile.user_id == user.id).first()
    if not profile:
        profile = AgentProfile(user_id=user.id)
        db.add(profile)
    profile.status = seed["status"]
    profile.business_name = seed["business_name"]
    profile.license_number = seed["license_number"]
    profile.bio = seed["bio"]
    profile.operating_districts = seed["operating_districts"]
    profile.commission_rate = seed["commission_rate"]
    profile.total_listings = seed["total_listings"]
    profile.total_rentals_facilitated = seed["total_rentals_facilitated"]
    profile.rating = seed["rating"]
    profile.approved_at = seed["approved_at"]
    db.flush()
    return profile


def get_or_create_property(db, owner, seed):
    prop = (
        db.query(Property)
        .filter(Property.owner_id == owner.id, Property.title == seed["title"])
        .first()
    )
    if not prop:
        prop = Property(owner_id=owner.id, title=seed["title"], description=seed["description"], property_type=seed["property_type"], district=seed["district"], ward=seed["ward"], street=seed["street"], rent_amount=seed["rent_amount"])
        db.add(prop)
    prop.description = seed["description"]
    prop.property_type = seed["property_type"]
    prop.status = seed["status"]
    prop.district = seed["district"]
    prop.ward = seed["ward"]
    prop.street = seed["street"]
    prop.latitude = seed["latitude"]
    prop.longitude = seed["longitude"]
    prop.bedrooms = seed["bedrooms"]
    prop.bathrooms = seed["bathrooms"]
    prop.size_sqm = seed["size_sqm"]
    prop.furnished = seed["furnished"]
    prop.has_water = seed["has_water"]
    prop.has_electricity = seed["has_electricity"]
    prop.has_parking = seed["has_parking"]
    prop.has_security = seed["has_security"]
    prop.rent_amount = seed["rent_amount"]
    prop.deposit_amount = seed["deposit_amount"]
    prop.is_premium = seed["is_premium"]
    prop.premium_expires_at = seed["premium_expires_at"]
    prop.is_verified = seed["is_verified"]
    prop.verified_at = seed["verified_at"]
    db.flush()

    existing_photos = {photo.photo_url: photo for photo in prop.photos}
    for index, photo_url in enumerate(seed["photos"]):
        photo = existing_photos.get(photo_url)
        if not photo:
            photo = PropertyPhoto(property_id=prop.id, photo_url=photo_url)
            db.add(photo)
        photo.is_primary = index == 0
    db.flush()
    return prop


def get_or_create_rental(db, prop, tenant, seed):
    rental = (
        db.query(Rental)
        .filter(Rental.property_id == prop.id, Rental.tenant_id == tenant.id)
        .first()
    )
    if not rental:
        rental = Rental(property_id=prop.id, tenant_id=tenant.id, landlord_id=prop.owner_id)
        db.add(rental)
    rental.status = seed["status"]
    rental.monthly_rent = seed["monthly_rent"]
    rental.start_date = seed["start_date"]
    rental.end_date = seed["end_date"]
    db.flush()

    payment = (
        db.query(RentPayment)
        .filter(RentPayment.rental_id == rental.id, RentPayment.payment_month == seed["payment_month"])
        .first()
    )
    if not payment:
        payment = RentPayment(rental_id=rental.id, payment_month=seed["payment_month"])
        db.add(payment)
    platform_fee = int(round(seed["monthly_rent"] * 0.015))
    payment.amount = seed["monthly_rent"]
    payment.platform_fee = platform_fee
    payment.landlord_payout = seed["monthly_rent"] - platform_fee
    payment.status = seed["payment_status"]
    payment.mpesa_reference = seed["mpesa_reference"]
    payment.paid_at = NOW if seed["payment_status"] == PaymentStatus.COMPLETED else None
    payment.notes = "Seeded testing payment"

    unlock_user = db.query(User).filter(User.phone == seed["unlock_phone"]).first()
    unlock = (
        db.query(ListingUnlock)
        .filter(ListingUnlock.renter_id == unlock_user.id, ListingUnlock.property_id == prop.id)
        .first()
    )
    if not unlock:
        unlock = ListingUnlock(renter_id=unlock_user.id, property_id=prop.id)
        db.add(unlock)
    unlock.amount_paid = seed["unlock_amount"]
    unlock.mpesa_reference = seed["unlock_reference"]
    db.flush()
    return rental


def seed_data():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        users_by_phone = {}
        for user_seed in USER_SEEDS:
            user = get_or_create_user(db, user_seed)
            users_by_phone[user.phone] = user

        for agent_seed in AGENT_SEEDS:
            get_or_create_agent_profile(db, users_by_phone[agent_seed["phone"]], agent_seed)

        properties_by_key = {}
        for property_seed in PROPERTY_SEEDS:
            owner = users_by_phone[property_seed["owner_phone"]]
            prop = get_or_create_property(db, owner, property_seed)
            properties_by_key[property_seed["key"]] = prop

        for rental_seed in RENTAL_SEEDS:
            prop = properties_by_key[rental_seed["property_key"]]
            tenant = users_by_phone[rental_seed["tenant_phone"]]
            get_or_create_rental(db, prop, tenant, rental_seed)

        db.commit()
        print("Seeded test users, agent profiles, properties, photos, rentals, payments, and unlocks.")
        print(f"Test password for all seeded accounts: {PASSWORD}")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_data()
