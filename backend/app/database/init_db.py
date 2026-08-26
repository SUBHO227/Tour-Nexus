from app.database.connection import Base, engine
from app.models import (
    Attraction,
    Destination,
    Disruption,
    User,
)


def init_db() -> None:
    Base.metadata.create_all(bind=engine)