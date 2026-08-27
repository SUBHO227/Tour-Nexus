from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.destination import Destination
from app.models.transport import Transport
from app.schemas.transport import TransportCreate, TransportResponse


router = APIRouter(
    prefix="/transport",
    tags=["Transport"],
)


@router.post(
    "/",
    response_model=TransportResponse,
    status_code=201,
)
def create_transport(
    transport: TransportCreate,
    db: Session = Depends(get_db),
):
    destination = db.get(
        Destination,
        transport.destination_id,
    )

    if destination is None:
        raise HTTPException(
            status_code=404,
            detail="Destination not found",
        )

    transport_data = Transport(
        **transport.model_dump()
    )

    db.add(transport_data)
    db.commit()
    db.refresh(transport_data)

    return transport_data


@router.get(
    "/",
    response_model=list[TransportResponse],
)
def get_transport(
    db: Session = Depends(get_db),
):
    result = db.execute(
        select(Transport)
        .order_by(Transport.id)
    )

    return result.scalars().all()


@router.get(
    "/destination/{destination_id}",
    response_model=list[TransportResponse],
)
def get_destination_transport(
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
        select(Transport)
        .where(
            Transport.destination_id == destination_id
        )
        .order_by(Transport.id)
    )

    return result.scalars().all()