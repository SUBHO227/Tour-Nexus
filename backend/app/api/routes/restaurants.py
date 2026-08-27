from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.destination import Destination
from app.models.restaurant import Restaurant
from app.schemas.restaurant import RestaurantCreate, RestaurantResponse


router = APIRouter(
    prefix="/restaurants",
    tags=["Restaurants"],
)


@router.post(
    "/",
    response_model=RestaurantResponse,
    status_code=201,
)
def create_restaurant(
    restaurant: RestaurantCreate,
    db: Session = Depends(get_db),
):
    destination = db.get(
        Destination,
        restaurant.destination_id,
    )

    if destination is None:
        raise HTTPException(
            status_code=404,
            detail="Destination not found",
        )

    restaurant_data = Restaurant(
        **restaurant.model_dump()
    )

    db.add(restaurant_data)
    db.commit()
    db.refresh(restaurant_data)

    return restaurant_data


@router.get(
    "/",
    response_model=list[RestaurantResponse],
)
def get_restaurants(
    db: Session = Depends(get_db),
):
    result = db.execute(
        select(Restaurant)
        .order_by(Restaurant.id)
    )

    return result.scalars().all()


@router.get(
    "/destination/{destination_id}",
    response_model=list[RestaurantResponse],
)
def get_destination_restaurants(
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
        select(Restaurant)
        .where(Restaurant.destination_id == destination_id)
        .order_by(Restaurant.id)
    )

    return result.scalars().all()