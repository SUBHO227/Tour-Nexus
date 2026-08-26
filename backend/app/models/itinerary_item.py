from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database.connection import Base


class ItineraryItem(Base):
    __tablename__ = "itinerary_items"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    itinerary_id: Mapped[int] = mapped_column(
        ForeignKey("itineraries.id"),
        index=True,
    )

    entity_type: Mapped[str] = mapped_column(
        String(50),
    )

    entity_id: Mapped[int] = mapped_column(
        Integer,
    )

    visit_start: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    visit_end: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    sequence_order: Mapped[int] = mapped_column(
        Integer,
    )