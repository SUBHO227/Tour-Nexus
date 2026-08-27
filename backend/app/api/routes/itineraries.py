from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.itinerary import Itinerary
from app.models.user import User
from app.schemas.itinerary import (
    ItineraryCreate,
    ItineraryResponse,
)


router = APIRouter(
    prefix="/itineraries",
    tags=["Itineraries"],
)


@router.post(
    "/",
    response_model=ItineraryResponse,
    status_code=201,
)
def create_itinerary(
    itinerary: ItineraryCreate,
    db: Session = Depends(get_db),
):
    tourist = db.get(User, itinerary.tourist_id)

    if tourist is None:
        raise HTTPException(
            status_code=404,
            detail="Tourist not found",
        )

    if itinerary.end_date < itinerary.start_date:
        raise HTTPException(
            status_code=400,
            detail="End date cannot be before start date",
        )

    itinerary_data = Itinerary(
        **itinerary.model_dump()
    )

    db.add(itinerary_data)
    db.commit()
    db.refresh(itinerary_data)

    return itinerary_data


@router.get(
    "/",
    response_model=list[ItineraryResponse],
)
def get_itineraries(
    db: Session = Depends(get_db),
):
    result = db.execute(
        select(Itinerary)
        .order_by(Itinerary.id)
    )

    return result.scalars().all()


@router.get(
    "/{itinerary_id}",
    response_model=ItineraryResponse,
)
def get_itinerary(
    itinerary_id: int,
    db: Session = Depends(get_db),
):
    itinerary = db.get(
        Itinerary,
        itinerary_id,
    )

    if itinerary is None:
        raise HTTPException(
            status_code=404,
            detail="Itinerary not found",
        )

    return itinerary