from sqlalchemy import Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database.connection import Base


class Service(Base):
    """
    A civic or infrastructure service at a destination - parking, roads,
    sanitation, waste management, water supply, emergency facilities.

    These are the nodes the concept document's dependency chain is really
    about (Parking -> Road -> Transport -> Attraction -> Sanitation/Waste).
    Attractions and hotels are only part of the picture; without these the
    graph cannot express the cascade the project is built to model.
    """

    __tablename__ = "services"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    destination_id: Mapped[int] = mapped_column(
        ForeignKey("destinations.id"),
        index=True,
    )

    name: Mapped[str] = mapped_column(String(200), index=True)

    # parking | road | sanitation | waste | water | emergency | transport_hub
    service_type: Mapped[str] = mapped_column(String(50), index=True)

    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    capacity: Mapped[int | None] = mapped_column(Integer, nullable=True)

    current_load: Mapped[int | None] = mapped_column(Integer, nullable=True)

    unit: Mapped[str | None] = mapped_column(String(50), nullable=True)

    status: Mapped[str] = mapped_column(String(30), default="operational")

    # Data-freshness fields from Section 10 of the concept document.
    source: Mapped[str] = mapped_column(String(120), default="estimated")
    confidence: Mapped[float] = mapped_column(Float, default=0.7)
