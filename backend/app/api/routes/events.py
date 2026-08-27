from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.destination import Destination
from app.models.event import Event
from app.schemas.event import EventCreate, EventResponse


router = APIRouter(
    prefix="/events",
    tags=["Events"],
)


@router.post(
    "/",
    response_model=EventResponse,
    status_code=201,
)
def create_event(
    event: EventCreate,
    db: Session = Depends(get_db),
):
    destination = db.get(
        Destination,
        event.destination_id,
    )

    if destination is None:
        raise HTTPException(
            status_code=404,
            detail="Destination not found",
        )

    if event.end_time <= event.start_time:
        raise HTTPException(
            status_code=400,
            detail="End time must be after start time",
        )

    if (
        event.expected_attendance is not None
        and event.expected_attendance < 0
    ):
        raise HTTPException(
            status_code=400,
            detail="Expected attendance cannot be negative",
        )

    event_data = Event(
        **event.model_dump()
    )

    db.add(event_data)
    db.commit()
    db.refresh(event_data)

    return event_data


@router.get(
    "/",
    response_model=list[EventResponse],
)
def get_events(
    db: Session = Depends(get_db),
):
    result = db.execute(
        select(Event)
        .order_by(Event.start_time)
    )

    return result.scalars().all()


@router.get(
    "/destination/{destination_id}",
    response_model=list[EventResponse],
)
def get_destination_events(
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
        select(Event)
        .where(Event.destination_id == destination_id)
        .order_by(Event.start_time)
    )

    return result.scalars().all()