from pydantic import BaseModel, ConfigDict


class ServiceBase(BaseModel):
    destination_id: int
    name: str
    service_type: str
    description: str | None = None
    capacity: int | None = None
    current_load: int | None = None
    unit: str | None = None
    status: str = "operational"
    source: str = "estimated"
    confidence: float = 0.7


class ServiceCreate(ServiceBase):
    pass


class ServiceResponse(ServiceBase):
    id: int
    load_ratio: float | None = None

    model_config = ConfigDict(from_attributes=True)
