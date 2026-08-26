from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database.connection import Base


class Transport(Base):
    __tablename__ = "transport"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    destination_id: Mapped[int] = mapped_column(
        ForeignKey("destinations.id"),
        index=True,
    )

    name: Mapped[str] = mapped_column(String(200), index=True)
    transport_type: Mapped[str] = mapped_column(
        String(50),
    )
    status: Mapped[str] = mapped_column(
        String(30),
        default="available",
    )