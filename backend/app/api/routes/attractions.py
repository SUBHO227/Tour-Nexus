from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.attraction import Attraction
from app.models.destination import Destination
from app.schemas.attraction import (
    AttractionCreate,
    AttractionResponse,
)

router = APIRouter(
    prefix="/attractions",
    tags=["Attractions"],
)


@router.get(
    "/",
    response_model=list[AttractionResponse],
)
def get_attractions(
    db: Session = Depends(get_db),
):
    result = db.execute(
        select(Attraction).order_by(Attraction.name)
    )

    return result.scalars().all()


@router.post(
    "/",
    response_model=AttractionResponse,
    status_code=201,
)
def create_attraction(
    attraction: AttractionCreate,
    db: Session = Depends(get_db),
):
    destination = db.get(
        Destination,
        attraction.destination_id,
    )

    if destination is None:
        raise HTTPException(
            status_code=404,
            detail="Destination not found",
        )

    new_attraction = Attraction(
        **attraction.model_dump()
    )

    db.add(new_attraction)
    db.commit()
    db.refresh(new_attraction)

    return new_attraction

@router.get(
    "/destination/{destination_id}",
    response_model=list[AttractionResponse],
)
def get_attractions_for_destination(
    destination_id: int,
    db: Session = Depends(get_db),
):
    destination = db.get(Destination, destination_id)

    if destination is None:
        raise HTTPException(
            status_code=404,
            detail="Destination not found",
        )

    result = db.execute(
        select(Attraction)
        .where(Attraction.destination_id == destination_id)
        .order_by(Attraction.name)
    )

    return result.scalars().all()


@router.get(
    "/{attraction_id}",
    response_model=AttractionResponse,
)
def get_attraction(
    attraction_id: int,
    db: Session = Depends(get_db),
):
    attraction = db.get(Attraction, attraction_id)

    if attraction is None:
        raise HTTPException(
            status_code=404,
            detail="Attraction not found",
        )

    return attraction
