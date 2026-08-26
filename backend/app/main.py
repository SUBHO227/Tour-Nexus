from fastapi import FastAPI

app = FastAPI(
    title="TourNexus API",
    description="Backend API for the TourNexus Smart Tourism Platform",
    version="1.0.0",
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