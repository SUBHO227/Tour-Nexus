from datetime import datetime

from pydantic import BaseModel, ConfigDict


class EventCreate(BaseModel):
    destination_id: int
    name: str
    description: str | None = None
    start_time: datetime
    end_time: datetime
    expected_attendance: int | None = None
    status: str = "scheduled"


class EventResponse(BaseModel):
    id: int
    destination_id: int
    name: str
    description: str | None
    start_time: datetime
    end_time: datetime
    expected_attendance: int | None
    status: str

    model_config = ConfigDict(from_attributes=True)