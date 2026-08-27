from pydantic import BaseModel, ConfigDict


class DependencyCreate(BaseModel):
    source_type: str
    source_id: int
    target_type: str
    target_id: int
    relationship: str
    weight: float = 1.0


class DependencyResponse(BaseModel):
    id: int
    source_type: str
    source_id: int
    target_type: str
    target_id: int
    relationship: str
    weight: float

    model_config = ConfigDict(from_attributes=True)