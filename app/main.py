from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.api import agents, auth, dashboard, ntzs_webhooks, properties, rentals, wallet
from app.core.config import Settings, settings
from app.core.database import Base, SessionLocal, engine
from app.frontend_bundle import FRONTEND_HTML

ROOT_DIR = Path(__file__).resolve().parents[1]
INDEX_FILE = ROOT_DIR / "index.html"
ASSETS_DIR = ROOT_DIR / "assets"
VITE_FILE = ROOT_DIR / "vite.svg"
FAVICON_FILE = ROOT_DIR / "favicon.svg"
APPLE_TOUCH_ICON = ROOT_DIR / "apple-touch-icon.png"
ICON_192 = ROOT_DIR / "icon-192.png"
ICON_512 = ROOT_DIR / "icon-512.png"
MANIFEST_FILE = ROOT_DIR / "site.webmanifest"
SPA_RESERVED_PREFIXES = (
    "api/",
    "docs",
    "openapi.json",
    "redoc",
    "health",
    "assets/",
    "vite.svg",
    "favicon.svg",
    "apple-touch-icon.png",
    "icon-192.png",
    "icon-512.png",
    "site.webmanifest",
)


def create_app(app_settings: Settings = settings) -> FastAPI:
    @asynccontextmanager
    async def lifespan(app: FastAPI):
        if app_settings.AUTO_CREATE_TABLES:
            Base.metadata.create_all(bind=engine)
        yield

    app = FastAPI(
        title=app_settings.APP_NAME,
        version=app_settings.VERSION,
        description=(
            "Dar es Salaam's verified rental marketplace. "
            "Digital rent collection, property management, and verified agents."
        ),
        lifespan=lifespan,
    )

    if app_settings.cors_origins_list:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=app_settings.cors_origins_list,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    if app_settings.allowed_hosts_list:
        app.add_middleware(
            TrustedHostMiddleware,
            allowed_hosts=app_settings.allowed_hosts_list,
        )

    @app.middleware("http")
    async def add_security_headers(request, call_next):
        response = await call_next(request)
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        response.headers.setdefault("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
        if app_settings.ENVIRONMENT.lower() in {"prod", "production"}:
            response.headers.setdefault(
                "Strict-Transport-Security",
                "max-age=31536000; includeSubDomains",
            )
        return response

    app.include_router(auth.router, prefix="/api/v1")
    app.include_router(properties.router, prefix="/api/v1")
    app.include_router(rentals.router, prefix="/api/v1")
    app.include_router(agents.router, prefix="/api/v1")
    app.include_router(dashboard.router, prefix="/api/v1")
    app.include_router(wallet.router, prefix="/api/v1")
    app.include_router(ntzs_webhooks.router, prefix="/api/v1")

    if ASSETS_DIR.exists():
        app.mount("/assets", StaticFiles(directory=ASSETS_DIR), name="assets")

    @app.get("/", include_in_schema=False)
    def root():
        if FRONTEND_HTML:
            return HTMLResponse(FRONTEND_HTML)
        if INDEX_FILE.exists():
            return FileResponse(INDEX_FILE)
        return {
            "name": app_settings.APP_NAME,
            "version": app_settings.VERSION,
            "description": "Verified Rental Marketplace for Dar es Salaam",
            "docs": "/docs",
        }

    @app.get("/health")
    def health():
        return {
            "status": "healthy",
            "app": app_settings.APP_NAME,
            "version": app_settings.VERSION,
            "environment": app_settings.ENVIRONMENT,
            "debug": app_settings.DEBUG,
            "auto_create_tables": app_settings.AUTO_CREATE_TABLES,
        }

    @app.get("/ready")
    def ready():
        try:
            with SessionLocal() as db:
                db.execute(text("SELECT 1"))
        except SQLAlchemyError:
            return {"status": "unready", "database": "unavailable"}
        return {"status": "ready", "database": "available"}

    @app.get("/vite.svg", include_in_schema=False)
    def vite_icon():
        if VITE_FILE.exists():
            return FileResponse(VITE_FILE)
        return {"detail": "Not Found"}

    @app.get("/favicon.svg", include_in_schema=False)
    def favicon():
        if FAVICON_FILE.exists():
            return FileResponse(FAVICON_FILE)
        return {"detail": "Not Found"}

    @app.get("/apple-touch-icon.png", include_in_schema=False)
    def apple_touch_icon():
        if APPLE_TOUCH_ICON.exists():
            return FileResponse(APPLE_TOUCH_ICON)
        return {"detail": "Not Found"}

    @app.get("/icon-192.png", include_in_schema=False)
    def icon_192():
        if ICON_192.exists():
            return FileResponse(ICON_192)
        return {"detail": "Not Found"}

    @app.get("/icon-512.png", include_in_schema=False)
    def icon_512():
        if ICON_512.exists():
            return FileResponse(ICON_512)
        return {"detail": "Not Found"}

    @app.get("/site.webmanifest", include_in_schema=False)
    def site_manifest():
        if MANIFEST_FILE.exists():
            return FileResponse(MANIFEST_FILE, media_type="application/manifest+json")
        return {"detail": "Not Found"}

    @app.get("/{full_path:path}", include_in_schema=False)
    def spa_fallback(full_path: str):
        if full_path.startswith(SPA_RESERVED_PREFIXES):
            return {"detail": "Not Found"}
        if FRONTEND_HTML:
            return HTMLResponse(FRONTEND_HTML)
        if INDEX_FILE.exists():
            return FileResponse(INDEX_FILE)
        return {
            "name": app_settings.APP_NAME,
            "version": app_settings.VERSION,
            "description": "Verified Rental Marketplace for Dar es Salaam",
            "docs": "/docs",
        }

    return app


app = create_app()
