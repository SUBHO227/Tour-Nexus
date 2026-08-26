from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.attraction import Attraction
from app.models.crowd import CrowdData
from app.schemas.crowd import CrowdDataCreate, CrowdDataResponse


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

    crowd_data = CrowdData(
        **crowd.model_dump()
    )

    db.add(crowd_data)
    db.commit()
    db.refresh(crowd_data)

    return crowd_data


@router.get(
    "/attraction/{attraction_id}",
    response_model=list[CrowdDataResponse],
)
def get_attraction_crowd(
    attraction_id: int,
    db: Session = Depends(get_db),
):
    attraction = db.get(
        Attraction,
        attraction_id,
    )

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