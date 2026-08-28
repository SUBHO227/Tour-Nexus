from pydantic import BaseModel, ConfigDict


class DestinationBase(BaseModel):
    name: str
    description: str | None = None
    city: str
    state: str | None = None
    country: str = "India"
    latitude: float | None = None
    longitude: float | None = None


class DestinationCreate(DestinationBase):
    pass


class DestinationResponse(DestinationBase):
    id: int

    model_config = ConfigDict(from_attributes=True)