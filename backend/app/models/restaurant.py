from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database.connection import Base


class Restaurant(Base):
    __tablename__ = "restaurants"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    destination_id: Mapped[int] = mapped_column(
        ForeignKey("destinations.id"),
        index=True,
    )

    name: Mapped[str] = mapped_column(String(200), index=True)
    cuisine: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )
    rating: Mapped[float | None] = mapped_column(nullable=True)
    status: Mapped[str] = mapped_column(
        String(30),
        default="open",
    )