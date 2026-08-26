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