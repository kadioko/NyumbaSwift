# NyumbaSwift - Verified Rental Marketplace

Dar es Salaam's verified rental marketplace. Digital rent collection, property management, and verified agents — all in one platform.

## The Problem

Dar's rental market runs on Facebook groups and hand-painted signs. No verification, no digital payments, no property management tools.

## The Solution

NyumbaSwift adds **verification**, **digital rent collection**, and **property management** in one app.

### Key Features

- **Verified Listings** — Every property goes through admin verification before going live
- **Digital Rent Collection** — Tenants pay rent via M-Pesa, landlords track payments. Platform takes 1.5% fee
- **Listing Unlock** — Renters pay TZS 5,000 to unlock landlord contact details
- **Premium Listings** — Landlords boost visibility for TZS 20,000/month
- **Verified Agents** — Convert brokers into "Verified Agents" who earn commissions
- **Property Management Dashboard** — Landlords track properties, tenants, and revenue

### Revenue Model

| Stream | Details |
|--------|---------|
| Rent Collection Fee | 1.5% on every rent payment processed |
| Renter Unlock Fee | TZS 5,000 per listing contact reveal |
| Premium Listings | TZS 20,000/month for boosted visibility |
| Agent Commissions | Platform share from verified agent facilitated deals |

### Revenue Path to $10M

- 5,000 landlord units managed
- $3M/month rent processed = $1M+ ARR
- Before counting renter unlock fees or premium listings

## Tech Stack

- **Backend:** Python, FastAPI
- **Database:** SQLAlchemy ORM (SQLite dev / PostgreSQL prod)
- **Auth:** JWT (python-jose + passlib/bcrypt)
- **Payments:** M-Pesa integration ready
- **Testing:** pytest

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn app.main:app --reload

# Run tests
pytest -v

# API docs
open http://localhost:8000/docs
```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register (renter, landlord, agent, admin) |
| POST | `/api/v1/auth/login` | Login with phone + password |
| GET | `/api/v1/auth/me` | Get current user profile |
| PATCH | `/api/v1/auth/me` | Update profile |
| POST | `/api/v1/auth/verify` | Submit national ID for verification |

### Properties
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/properties/` | Create listing (landlord) |
| GET | `/api/v1/properties/` | Search listings (filter by district, type, rent, etc.) |
| GET | `/api/v1/properties/{id}` | Get property details |
| PATCH | `/api/v1/properties/{id}` | Update listing |
| POST | `/api/v1/properties/{id}/verify` | Admin verifies listing |
| POST | `/api/v1/properties/{id}/boost` | Upgrade to premium |

### Rentals & Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/rentals/` | Create rental agreement (landlord) |
| GET | `/api/v1/rentals/my` | My rentals (tenant or landlord) |
| POST | `/api/v1/rentals/{id}/end` | End rental |
| POST | `/api/v1/rentals/payments` | Initiate rent payment (tenant) |
| POST | `/api/v1/rentals/payments/{id}/confirm` | Confirm M-Pesa payment |
| GET | `/api/v1/rentals/payments/history` | Payment history |
| POST | `/api/v1/rentals/unlock` | Unlock landlord contact (TZS 5,000) |

### Verified Agents
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/agents/apply` | Apply as verified agent |
| GET | `/api/v1/agents/me` | My agent profile |
| GET | `/api/v1/agents/` | List approved agents |
| GET | `/api/v1/agents/pending` | Admin: pending applications |
| POST | `/api/v1/agents/{id}/review` | Admin: approve/reject agent |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/dashboard/landlord/summary` | Landlord dashboard summary |
| GET | `/api/v1/dashboard/landlord/properties` | Landlord property details |
| GET | `/api/v1/dashboard/admin/platform-stats` | Platform-wide stats |

## Project Structure

```
app/
├── api/           # Route handlers
│   ├── auth.py        # Registration, login, verification
│   ├── properties.py  # CRUD, search, verify, boost
│   ├── rentals.py     # Rentals, payments, unlock
│   ├── agents.py      # Verified agent system
│   ├── dashboard.py   # Management dashboards
│   └── deps.py        # Auth dependencies
├── models/        # SQLAlchemy models
│   ├── user.py        # Users with roles & verification
│   ├── property.py    # Properties & photos
│   ├── rental.py      # Rentals, payments, unlocks
│   └── agent.py       # Agent profiles
├── schemas/       # Pydantic request/response models
├── core/          # Config, database, security
└── main.py        # FastAPI app entry point
tests/             # Full test suite
```

## Key Insight

> Convert brokers into "Verified Agents" — turn your biggest threat into your sales force.

Brokers already know the market. Instead of fighting them, NyumbaSwift gives them a verified badge, commission tracking, and digital tools. They bring listings; we process payments.

## Environment Variables

Copy `.env.example` to `.env` and configure:

```
DATABASE_URL=sqlite:///./nyumbaswift.db
SECRET_KEY=your-secret-key-here
MPESA_API_KEY=your-mpesa-key
MPESA_PUBLIC_KEY=your-mpesa-public-key
MPESA_SERVICE_PROVIDER_CODE=your-sp-code
```
