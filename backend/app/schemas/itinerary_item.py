from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ItineraryItemCreate(BaseModel):
    itinerary_id: int
    entity_type: str
    entity_id: int
    visit_start: datetime | None = None
    visit_end: datetime | None = None
    sequence_order: int


class ItineraryItemResponse(BaseModel):
    id: int
    itinerary_id: int
    entity_type: str
    entity_id: int
    visit_start: datetime | None
    visit_end: datetime | None
    sequence_order: int

    model_config = ConfigDict(from_attributes=True)