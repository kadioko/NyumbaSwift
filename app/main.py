from fastapi import FastAPI
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from app.api import agents, auth, dashboard, properties, rentals, wallet
from app.core.config import settings
from app.core.database import Base, engine
from app.frontend_bundle import FRONTEND_HTML

# Create tables
Base.metadata.create_all(bind=engine)

ROOT_DIR = Path(__file__).resolve().parents[1]
INDEX_FILE = ROOT_DIR / "index.html"
ASSETS_DIR = ROOT_DIR / "assets"
VITE_FILE = ROOT_DIR / "vite.svg"
FAVICON_FILE = ROOT_DIR / "favicon.svg"
APPLE_TOUCH_ICON = ROOT_DIR / "apple-touch-icon.png"
ICON_192 = ROOT_DIR / "icon-192.png"
ICON_512 = ROOT_DIR / "icon-512.png"
MANIFEST_FILE = ROOT_DIR / "site.webmanifest"

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description=(
        "Dar es Salaam's verified rental marketplace. "
        "Digital rent collection, property management, and verified agents."
    ),
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(properties.router, prefix="/api/v1")
app.include_router(rentals.router, prefix="/api/v1")
app.include_router(agents.router, prefix="/api/v1")
app.include_router(dashboard.router, prefix="/api/v1")
app.include_router(wallet.router, prefix="/api/v1")

if ASSETS_DIR.exists():
    app.mount("/assets", StaticFiles(directory=ASSETS_DIR), name="assets")


@app.get("/", include_in_schema=False)
def root():
    if FRONTEND_HTML:
        return HTMLResponse(FRONTEND_HTML)
    if INDEX_FILE.exists():
        return FileResponse(INDEX_FILE)
    return {
        "name": settings.APP_NAME,
        "version": settings.VERSION,
        "description": "Verified Rental Marketplace for Dar es Salaam",
        "docs": "/docs",
    }


@app.get("/health")
def health():
    return {"status": "healthy"}


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
    if full_path.startswith(
        ("api/", "docs", "openapi.json", "redoc", "health", "assets/", "vite.svg", "favicon.svg", "apple-touch-icon.png", "icon-192.png", "icon-512.png", "site.webmanifest")
    ):
        return {"detail": "Not Found"}
    if FRONTEND_HTML:
        return HTMLResponse(FRONTEND_HTML)
    if INDEX_FILE.exists():
        return FileResponse(INDEX_FILE)
    return {
        "name": settings.APP_NAME,
        "version": settings.VERSION,
        "description": "Verified Rental Marketplace for Dar es Salaam",
        "docs": "/docs",
    }
