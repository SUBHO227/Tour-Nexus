from datetime import date

from pydantic import BaseModel, ConfigDict


class ItineraryCreate(BaseModel):
    tourist_id: int
    title: str
    start_date: date
    end_date: date
    status: str = "active"


class ItineraryResponse(BaseModel):
    id: int
    tourist_id: int
    title: str
    start_date: date
    end_date: date
    status: str

    model_config = ConfigDict(from_attributes=True)