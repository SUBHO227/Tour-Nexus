from pydantic import BaseModel, ConfigDict


class TransportCreate(BaseModel):
    destination_id: int
    name: str
    transport_type: str
    status: str = "available"


class TransportResponse(BaseModel):
    id: int
    destination_id: int
    name: str
    transport_type: str
    status: str

    model_config = ConfigDict(from_attributes=True)