from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.attraction import Attraction
from app.models.crowd import CrowdData
from app.schemas.crowd import CrowdDataCreate, CrowdDataResponse
from app.services.crowd_service import (
    calculate_crowd_score,
    get_crowd_level,
)


router = APIRouter(
    prefix="/crowd",
    tags=["Crowd"],
)

@router.post(
    "/",
    response_model=CrowdDataResponse,
    status_code=201,
)
def create_crowd_data(
    crowd: CrowdDataCreate,
    db: Session = Depends(get_db),
):
    attraction = db.get(
        Attraction,
        crowd.attraction_id,
    )

    if attraction is None:
        raise HTTPException(
            status_code=404,
            detail="Attraction not found",
        )

    try:
        crowd_score = calculate_crowd_score(
            crowd.estimated_visitors,
            crowd.capacity,
        )

        crowd_level = get_crowd_level(
            crowd_score,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    crowd_data = CrowdData(
        attraction_id=crowd.attraction_id,
        estimated_visitors=crowd.estimated_visitors,
        capacity=crowd.capacity,
        crowd_score=crowd_score,
        crowd_level=crowd_level,
        source=crowd.source,
    )

    db.add(crowd_data)
    db.commit()
    db.refresh(crowd_data)

    return crowd_data

@router.get(
    "/",
    response_model=list[CrowdDataResponse],
)
def get_crowd_data(
    db: Session = Depends(get_db),
):
    """Latest-first crowd readings across every attraction."""

    result = db.execute(
        select(CrowdData).order_by(CrowdData.timestamp.desc())
    )

    return result.scalars().all()


@router.get(
    "/latest",
    response_model=list[CrowdDataResponse],
)
def get_latest_crowd_per_attraction(
    db: Session = Depends(get_db),
):
    """One reading per attraction: the most recent one.

    This is what the dashboards actually need - a snapshot of current
    conditions rather than the full history.
    """

    result = db.execute(
        select(CrowdData).order_by(CrowdData.timestamp.desc())
    )

    latest: dict[int, CrowdData] = {}

    for reading in result.scalars().all():
        latest.setdefault(reading.attraction_id, reading)

    return sorted(latest.values(), key=lambda r: r.attraction_id)


@router.get(
    "/attraction/{attraction_id}",
    response_model=list[CrowdDataResponse],
)
def get_crowd_for_attraction(
    attraction_id: int,
    db: Session = Depends(get_db),
):
    attraction = db.get(Attraction, attraction_id)

    if attraction is None:
        raise HTTPException(
            status_code=404,
            detail="Attraction not found",
        )

    result = db.execute(
        select(CrowdData)
        .where(CrowdData.attraction_id == attraction_id)
        .order_by(CrowdData.timestamp.desc())
    )

    return result.scalars().all()
