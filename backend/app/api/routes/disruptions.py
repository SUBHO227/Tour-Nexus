from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.attraction import Attraction
from app.models.disruption import Disruption
from app.schemas.disruption import (
    DisruptionCreate,
    DisruptionResponse,
)


router = APIRouter(
    prefix="/disruptions",
    tags=["Disruptions"],
)


@router.post(
    "/",
    response_model=DisruptionResponse,
    status_code=201,
)
def create_disruption(
    disruption: DisruptionCreate,
    db: Session = Depends(get_db),
):
    if disruption.attraction_id is not None:
        attraction = db.get(
            Attraction,
            disruption.attraction_id,
        )

        if attraction is None:
            raise HTTPException(
                status_code=404,
                detail="Attraction not found",
            )

    disruption_data = Disruption(
        **disruption.model_dump(
            exclude_none=True
        )
    )

    db.add(disruption_data)
    db.commit()
    db.refresh(disruption_data)

    return disruption_data


@router.get(
    "/",
    response_model=list[DisruptionResponse],
)
def get_disruptions(
    db: Session = Depends(get_db),
):
    result = db.execute(
        select(Disruption)
        .order_by(Disruption.started_at.desc())
    )

    return result.scalars().all()


@router.get(
    "/active",
    response_model=list[DisruptionResponse],
)
def get_active_disruptions(
    db: Session = Depends(get_db),
):
    result = db.execute(
        select(Disruption)
        .where(Disruption.status == "active")
        .order_by(Disruption.started_at.desc())
    )

    return result.scalars().all()