from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database.connection import Base


class CrowdData(Base):
    __tablename__ = "crowd_data"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    attraction_id: Mapped[int] = mapped_column(
        ForeignKey("attractions.id"),
        index=True,
    )

    timestamp: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        index=True,
    )

    estimated_visitors: Mapped[int] = mapped_column(
        Integer,
    )

    capacity: Mapped[int] = mapped_column(
        Integer,
    )

    crowd_score: Mapped[float] = mapped_column(
        Float,
    )

    crowd_level: Mapped[str] = mapped_column(
        String(30),
    )

    source: Mapped[str] = mapped_column(
        String(100),
        default="estimated",
    )