from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database.connection import Base


class Attraction(Base):
    __tablename__ = "attractions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    destination_id: Mapped[int] = mapped_column(
        ForeignKey("destinations.id"),
        index=True,
    )

    name: Mapped[str] = mapped_column(String(200), index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    category: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="open",
    )