from fastapi import FastAPI
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from app.api import agents, auth, dashboard, properties, rentals
from app.core.config import settings
from app.core.database import Base, engine
from app.frontend_bundle import FRONTEND_HTML

# Create tables
Base.metadata.create_all(bind=engine)

ROOT_DIR = Path(__file__).resolve().parents[1]
INDEX_FILE = ROOT_DIR / "index.html"
ASSETS_DIR = ROOT_DIR / "assets"
VITE_FILE = ROOT_DIR / "vite.svg"

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


@app.get("/{full_path:path}", include_in_schema=False)
def spa_fallback(full_path: str):
    if full_path.startswith(
        ("api/", "docs", "openapi.json", "redoc", "health", "assets/", "vite.svg")
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
