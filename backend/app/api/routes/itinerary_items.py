from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.itinerary import Itinerary
from app.models.itinerary_item import ItineraryItem
from app.schemas.itinerary_item import (
    ItineraryItemCreate,
    ItineraryItemResponse,
)


router = APIRouter(
    prefix="/itinerary-items",
    tags=["Itinerary Items"],
)


@router.post(
    "/",
    response_model=ItineraryItemResponse,
    status_code=201,
)
def create_itinerary_item(
    item: ItineraryItemCreate,
    db: Session = Depends(get_db),
):
    itinerary = db.get(
        Itinerary,
        item.itinerary_id,
    )

    if itinerary is None:
        raise HTTPException(
            status_code=404,
            detail="Itinerary not found",
        )

    if item.visit_start and item.visit_end:
        if item.visit_end < item.visit_start:
            raise HTTPException(
                status_code=400,
                detail="Visit end cannot be before visit start",
            )

    item_data = ItineraryItem(
        **item.model_dump()
    )

    db.add(item_data)
    db.commit()
    db.refresh(item_data)

    return item_data


@router.get(
    "/itinerary/{itinerary_id}",
    response_model=list[ItineraryItemResponse],
)
def get_itinerary_items(
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

    result = db.execute(
        select(ItineraryItem)
        .where(
            ItineraryItem.itinerary_id == itinerary_id
        )
        .order_by(ItineraryItem.sequence_order)
    )

    return result.scalars().all()