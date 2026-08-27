from fastapi import FastAPI
from app.api.routes.destinations import router as destinations_router
from app.api.routes.attractions import router as attractions_router
from app.api.routes.crowd import router as crowd_router
from app.api.routes.disruptions import router as disruptions_router
from app.api.routes.dependencies import router as dependencies_router
from app.api.routes.itineraries import router as itineraries_router
from app.api.routes.itinerary_items import router as itinerary_items_router
from app.api.routes.users import router as users_router
from app.api.routes.hotels import router as hotels_router
from app.api.routes.restaurants import router as restaurants_router
from app.api.routes.transport import router as transport_router
from app.api.routes.events import router as events_router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="TourNexus API",
    description="Backend API for the TourNexus Smart Tourism Platform",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5500",
        "http://127.0.0.1:5500",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(
    destinations_router,
    prefix="/api",
)

app.include_router(
    attractions_router,
    prefix="/api",
)

app.include_router(
    crowd_router,
    prefix="/api",
)

app.include_router(
    disruptions_router,
    prefix="/api",
)

app.include_router(
    dependencies_router,
    prefix="/api",
)

app.include_router(
    itineraries_router,
    prefix="/api",
)

app.include_router(
    itinerary_items_router,
    prefix="/api",
)

app.include_router(
    users_router,
    prefix="/api",
)

app.include_router(
    hotels_router,
    prefix="/api",
)

app.include_router(
    restaurants_router,
    prefix="/api",
)

app.include_router(
    transport_router,
    prefix="/api",
)

app.include_router(
    events_router,
    prefix="/api",
)

@app.get("/")
def root():
    return {
        "message": "TourNexus API is running"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "TourNexus Backend"
    }