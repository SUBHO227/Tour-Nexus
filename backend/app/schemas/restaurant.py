from pydantic import BaseModel, ConfigDict


class RestaurantCreate(BaseModel):
    destination_id: int
    name: str
    cuisine: str | None = None
    rating: float | None = None
    status: str = "open"


class RestaurantResponse(BaseModel):
    id: int
    destination_id: int
    name: str
    cuisine: str | None
    rating: float | None
    status: str

    model_config = ConfigDict(from_attributes=True)