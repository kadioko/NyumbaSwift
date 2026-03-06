from fastapi import FastAPI

from app.api import agents, auth, dashboard, properties, rentals
from app.core.config import settings
from app.core.database import Base, engine

# Create tables
Base.metadata.create_all(bind=engine)

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


@app.get("/")
def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.VERSION,
        "description": "Verified Rental Marketplace for Dar es Salaam",
        "docs": "/docs",
    }


@app.get("/health")
def health():
    return {"status": "healthy"}
