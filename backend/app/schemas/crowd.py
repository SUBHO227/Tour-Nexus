from datetime import datetime

from pydantic import BaseModel, ConfigDict


class CrowdDataCreate(BaseModel):
    attraction_id: int
    estimated_visitors: int
    capacity: int
    crowd_score: float
    crowd_level: str
    source: str = "estimated"


class CrowdDataResponse(BaseModel):
    id: int
    attraction_id: int
    timestamp: datetime
    estimated_visitors: int
    capacity: int
    crowd_score: float
    crowd_level: str
    source: str

    model_config = ConfigDict(from_attributes=True)