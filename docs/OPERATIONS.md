# NyumbaSwift Operations

This document captures the checks and deployment habits that keep the repo healthy.

## Local Setup

```bash
powershell -ExecutionPolicy Bypass -File scripts/setup_backend.ps1
npm --prefix frontend ci
```

The backend script creates and uses `.venv`, then installs `requirements.txt`. Avoid global Python installs for routine checks.

## Checks

```bash
powershell -ExecutionPolicy Bypass -File scripts/test_backend.ps1
powershell -ExecutionPolicy Bypass -File scripts/check_migrations.ps1
npm --prefix frontend run lint
npm --prefix frontend run test
npm run build:frontend-bundle
```

Use `npm run check:frontend-bundle` before publishing when you specifically want to prove `app/frontend_bundle.py` matches the latest frontend build.

## Migrations

Alembic reads `DATABASE_URL` from the app settings.

```bash
.venv/Scripts/python -m alembic upgrade head
.venv/Scripts/python -m alembic revision --autogenerate -m "describe change"
```

Production deploys should apply Alembic migrations before app rollout and should run with `AUTO_CREATE_TABLES=false`.

## Embedded Frontend

The FastAPI app serves the generated SPA from `app/frontend_bundle.py`. Any frontend source change that affects `frontend/dist` must be followed by:

```bash
npm run build:frontend-bundle
```

CI runs the same generation step and fails if the checked-in bundle is stale.

## Production Safety

Required production posture:

- `ENVIRONMENT=production`
- `DEBUG=false`
- PostgreSQL `DATABASE_URL`
- strong `SECRET_KEY`
- explicit `ALLOWED_HOSTS`
- `BCRYPT_ROUNDS>=12`
- `AUTO_CREATE_TABLES=false`

The application rejects unsafe production settings at startup. Responses include security headers by default, and production responses include HSTS.

## Health And Readiness

- `/health`: liveness and safe runtime metadata.
- `/ready`: database readiness probe.

Use `/ready` for load balancers or release gates that should only route traffic after the database is reachable.

## CI

GitHub Actions runs:

- backend dependency install
- backend test suite
- Alembic migration smoke test
- frontend install and audit
- frontend lint
- frontend Vitest suite
- frontend bundle generation and freshness check
