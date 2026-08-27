from pydantic import BaseModel, ConfigDict


class HotelCreate(BaseModel):
    destination_id: int
    name: str
    rating: float | None = None
    status: str = "available"


class HotelResponse(BaseModel):
    id: int
    destination_id: int
    name: str
    rating: float | None
    status: str

    model_config = ConfigDict(from_attributes=True)