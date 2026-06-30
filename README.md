# NyumbaSwift

Verified rentals, digital rent collection, wallet-powered housing payments, and landlord operations for Dar es Salaam.

## What The App Does

- Verified renter, landlord, agent, and admin accounts
- Property listings with search, premium boosts, and unlockable contact details
- Rental agreements, rent collection, and landlord dashboards
- In-app wallet for deposit, withdraw, transfer, and rent payments
- nTZS-powered mobile money and card deposits plus mobile money withdrawals

## Key Features

- Verified listings before they go live
- In-app wallet balances for tenants and landlords
- Rent collection with platform fees and ledger history
- Landlord due-date tracking and WhatsApp reminder links
- Shared nTZS webhook handling for wallet, rent, and unlock flows

## Stack

- Backend: FastAPI, SQLAlchemy, Pydantic
- Database: SQLAlchemy ORM with SQLite in development and PostgreSQL in production
- Auth: JWT plus bcrypt password hashing
- Frontend: React 19, Vite 8, Tailwind CSS 4
- Payments: nTZS partner API
- Tests: pytest and Vitest
- CI: GitHub Actions for backend, frontend, migrations, and embedded bundle freshness

## Local Development

Backend setup:

```bash
powershell -ExecutionPolicy Bypass -File scripts/setup_backend.ps1
```

Frontend setup:

```bash
cd frontend
npm install
cd ..
```

Copy `.env.example` to `.env`, then start the backend:

```bash
.venv\Scripts\python -m uvicorn app.main:app --reload
```

Useful URLs:

- API docs: `http://localhost:8000/docs`
- App: `http://localhost:8000`
- Health: `http://localhost:8000/health`
- Ready probe: `http://localhost:8000/ready`
- Frontend dev server only: `cd frontend && npm run dev`

## Development Workflow

Backend checks:

```bash
powershell -ExecutionPolicy Bypass -File scripts/test_backend.ps1
powershell -ExecutionPolicy Bypass -File scripts/check_migrations.ps1
```

Frontend and embedded bundle:

```bash
npm run build
```

When frontend dependencies are already installed, the root bundle-only path is:

```bash
npm run build:frontend-bundle
```

CI validates the embedded frontend with:

```bash
npm run check:frontend-bundle
```

## Environment Variables

The backend and frontend use different public URLs when you deploy Railway + Vercel separately.

### Backend on Railway

Set these on Railway:

```env
DATABASE_URL=postgresql://...
SECRET_KEY=replace-this
NTZS_BASE_URL=https://www.ntzs.co.tz
NTZS_API_KEY=your_ntzs_api_key
NTZS_WEBHOOK_SECRET=your_ntzs_webhook_secret
PUBLIC_BASE_URL=https://nyumbaswift-production.up.railway.app
```

`PUBLIC_BASE_URL` must be the public backend URL, not the Vercel frontend URL.

### Frontend on Vercel

Set this on Vercel:

```env
VITE_API_BASE_URL=https://nyumbaswift-production.up.railway.app
```

That makes the deployed frontend call the Railway backend instead of trying to use the same origin.

## Production Configuration

Set these explicitly before production deploys:

- `ENVIRONMENT=production`
- `DEBUG=false`
- `DATABASE_URL=postgresql://...`
- `SECRET_KEY=<strong secret>`
- `AUTO_CREATE_TABLES=false`
- `ALLOWED_HOSTS=<your api/web hosts>`
- `CORS_ORIGINS=<browser origins if frontend and API are split>`
- `NTZS_API_KEY=<partner api key>`
- `NTZS_WEBHOOK_SECRET=<shared webhook secret>`
- `PUBLIC_BASE_URL=<public https backend base url>`

## nTZS Webhook Setup

NyumbaSwift uses one shared webhook endpoint for wallet and rental payment events:

```text
https://nyumbaswift-production.up.railway.app/api/v1/ntzs/webhooks
```

In the nTZS developer dashboard:

1. Paste the Railway webhook URL above into the webhook field.
2. Save a secret string as `NTZS_WEBHOOK_SECRET` in Railway.
3. Use the same exact secret value in the nTZS dashboard if your account supports signed webhook verification.

Legacy paths under `/api/v1/wallet/webhooks/ntzs` and `/api/v1/rentals/webhooks/ntzs` still exist as aliases, but the shared endpoint above is the canonical route.

## Runtime Probes

- `/health` returns safe runtime metadata for liveness checks.
- `/ready` executes a database probe and reports whether the app is ready to serve traffic.

## Wallet And Rent Flow

### Deposit

1. User starts a deposit from the wallet page.
2. NyumbaSwift creates an nTZS deposit request.
3. nTZS posts the result to `/api/v1/ntzs/webhooks`.
4. The webhook marks the matching wallet transaction as `completed` or `failed`.
5. The balance and recent activity refresh from the same transaction record.

### Withdraw

1. User requests a withdrawal of at least TZS 5,000.
2. NyumbaSwift reserves the balance immediately.
3. nTZS completes or fails the payout.
4. The webhook finalizes the withdrawal or refunds the reserved amount.

### Pay Rent With Wallet

1. Tenant funds the wallet with mobile money or card.
2. Tenant pays rent from the wallet balance.
3. Rent payment records update the rental ledger.
4. Landlord wallet balances can receive rent collections and outgoing transfers.

## Main API Areas

### Auth

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `PATCH /api/v1/auth/me`

### Properties

- `GET /api/v1/properties/`
- `GET /api/v1/properties/{id}`
- `POST /api/v1/properties/`
- `PATCH /api/v1/properties/{id}`

### Rentals

- `POST /api/v1/rentals/`
- `GET /api/v1/rentals/my`
- `POST /api/v1/rentals/payments`
- `GET /api/v1/rentals/payments/history`
- `POST /api/v1/rentals/unlock`

### Wallet

- `GET /api/v1/wallet/`
- `GET /api/v1/wallet/transactions`
- `POST /api/v1/wallet/deposit`
- `POST /api/v1/wallet/withdraw`
- `POST /api/v1/wallet/send`

### Webhooks

- `POST /api/v1/ntzs/webhooks`

## Test Commands

Backend:

```bash
.\.venv\Scripts\python.exe -m pytest -q
```

Frontend:

```bash
cd frontend
npm test
npm run build
```

## Seed Data

Sample accounts and seeded listings are documented in `TESTING_DATA.md`.

Run the seed script with:

```bash
python seed_test_data.py
```
