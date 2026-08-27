from datetime import datetime

from pydantic import BaseModel, ConfigDict


class DisruptionCreate(BaseModel):
    attraction_id: int | None = None
    disruption_type: str
    status: str = "active"
    description: str | None = None
    started_at: datetime | None = None
    resolved_at: datetime | None = None


class DisruptionResponse(BaseModel):
    id: int
    attraction_id: int | None
    disruption_type: str
    status: str
    description: str | None
    started_at: datetime
    resolved_at: datetime | None

    model_config = ConfigDict(from_attributes=True)