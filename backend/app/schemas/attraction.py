from pydantic import BaseModel, ConfigDict


class AttractionBase(BaseModel):
    destination_id: int
    name: str
    description: str | None = None
    category: str | None = None
    status: str = "open"


class AttractionCreate(AttractionBase):
    pass


class AttractionResponse(AttractionBase):
    id: int

    model_config = ConfigDict(from_attributes=True)