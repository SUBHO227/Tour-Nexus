from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.destination import Destination
from app.models.service import Service
from app.schemas.service import ServiceCreate, ServiceResponse


router = APIRouter(
    prefix="/services",
    tags=["Services"],
)


def _with_load_ratio(service: Service) -> ServiceResponse:
    response = ServiceResponse.model_validate(service)

    if service.capacity and service.current_load is not None:
        response.load_ratio = round(
            min(service.current_load / service.capacity, 2.0),
            3,
        )

    return response


@router.get(
    "/",
    response_model=list[ServiceResponse],
)
def get_services(
    service_type: str | None = None,
    db: Session = Depends(get_db),
):
    statement = select(Service)

    if service_type:
        statement = statement.where(Service.service_type == service_type)

    rows = db.execute(statement.order_by(Service.name)).scalars().all()

    return [_with_load_ratio(row) for row in rows]


@router.get(
    "/destination/{destination_id}",
    response_model=list[ServiceResponse],
)
def get_services_for_destination(
    destination_id: int,
    db: Session = Depends(get_db),
):
    destination = db.get(Destination, destination_id)

    if destination is None:
        raise HTTPException(
            status_code=404,
            detail="Destination not found",
        )

    rows = db.execute(
        select(Service)
        .where(Service.destination_id == destination_id)
        .order_by(Service.name)
    ).scalars().all()

    return [_with_load_ratio(row) for row in rows]


@router.post(
    "/",
    response_model=ServiceResponse,
    status_code=201,
)
def create_service(
    service: ServiceCreate,
    db: Session = Depends(get_db),
):
    destination = db.get(Destination, service.destination_id)

    if destination is None:
        raise HTTPException(
            status_code=404,
            detail="Destination not found",
        )

    new_service = Service(**service.model_dump())

    db.add(new_service)
    db.commit()
    db.refresh(new_service)

    return _with_load_ratio(new_service)
