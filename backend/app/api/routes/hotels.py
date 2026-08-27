from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.destination import Destination
from app.models.hotel import Hotel
from app.schemas.hotel import HotelCreate, HotelResponse


router = APIRouter(
    prefix="/hotels",
    tags=["Hotels"],
)


@router.post(
    "/",
    response_model=HotelResponse,
    status_code=201,
)
def create_hotel(
    hotel: HotelCreate,
    db: Session = Depends(get_db),
):
    destination = db.get(
        Destination,
        hotel.destination_id,
    )

    if destination is None:
        raise HTTPException(
            status_code=404,
            detail="Destination not found",
        )

    hotel_data = Hotel(
        **hotel.model_dump()
    )

    db.add(hotel_data)
    db.commit()
    db.refresh(hotel_data)

    return hotel_data


@router.get(
    "/",
    response_model=list[HotelResponse],
)
def get_hotels(
    db: Session = Depends(get_db),
):
    result = db.execute(
        select(Hotel)
        .order_by(Hotel.id)
    )

    return result.scalars().all()


@router.get(
    "/destination/{destination_id}",
    response_model=list[HotelResponse],
)
def get_destination_hotels(
    destination_id: int,
    db: Session = Depends(get_db),
):
    destination = db.get(
        Destination,
        destination_id,
    )

    if destination is None:
        raise HTTPException(
            status_code=404,
            detail="Destination not found",
        )

    result = db.execute(
        select(Hotel)
        .where(Hotel.destination_id == destination_id)
        .order_by(Hotel.id)
    )

    return result.scalars().all()