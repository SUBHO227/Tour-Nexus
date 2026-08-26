from sqlalchemy import Float, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database.connection import Base


class Dependency(Base):
    __tablename__ = "dependencies"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    source_type: Mapped[str] = mapped_column(
        String(50),
        index=True,
    )

    source_id: Mapped[int] = mapped_column(
        index=True,
    )

    target_type: Mapped[str] = mapped_column(
        String(50),
        index=True,
    )

    target_id: Mapped[int] = mapped_column(
        index=True,
    )

    relationship: Mapped[str] = mapped_column(
        String(100),
    )

    weight: Mapped[float] = mapped_column(
        Float,
        default=1.0,
    )