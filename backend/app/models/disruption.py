from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database.connection import Base


class Disruption(Base):
    __tablename__ = "disruptions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    attraction_id: Mapped[int | None] = mapped_column(
        ForeignKey("attractions.id"),
        nullable=True,
        index=True,
    )

    disruption_type: Mapped[str] = mapped_column(
        String(100),
    )

    status: Mapped[str] = mapped_column(
        String(50),
        default="active",
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    started_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )

    resolved_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )