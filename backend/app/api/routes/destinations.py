from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.destination import Destination
from app.schemas.destination import (
    DestinationCreate,
    DestinationResponse,
)

router = APIRouter(
    prefix="/destinations",
    tags=["Destinations"],
)


@router.get(
    "/",
    response_model=list[DestinationResponse],
)
def get_destinations(
    db: Session = Depends(get_db),
):
    result = db.execute(
        select(Destination).order_by(Destination.name)
    )

    return result.scalars().all()


@router.post(
    "/",
    response_model=DestinationResponse,
    status_code=201,
)
def create_destination(
    destination: DestinationCreate,
    db: Session = Depends(get_db),
):
    new_destination = Destination(
        **destination.model_dump()
    )

    db.add(new_destination)
    db.commit()
    db.refresh(new_destination)

    return new_destination

@router.get(
    "/{destination_id}",
    response_model=DestinationResponse,
)
def get_destination(
    destination_id: int,
    db: Session = Depends(get_db),
):
    destination = db.get(Destination, destination_id)

    if destination is None:
        raise HTTPException(
            status_code=404,
            detail="Destination not found",
        )

    return destination
