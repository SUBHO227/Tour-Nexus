import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

load_dotenv()


# PostgreSQL is the production database. When DATABASE_URL is not set we fall
# back to a local SQLite file so the project can be cloned and demoed without
# installing PostgreSQL first.
DEFAULT_SQLITE_URL = "sqlite:///./tournexus.db"

DATABASE_URL = os.getenv("DATABASE_URL") or DEFAULT_SQLITE_URL

IS_SQLITE = DATABASE_URL.startswith("sqlite")


engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    connect_args={"check_same_thread": False} if IS_SQLITE else {},
)


SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()
