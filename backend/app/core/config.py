import os

from dotenv import load_dotenv

load_dotenv()


JWT_SECRET_KEY = os.getenv(
    "JWT_SECRET_KEY",
    "tournexus-development-secret-change-me",
)

JWT_ALGORITHM = "HS256"

JWT_EXPIRE_MINUTES = int(
    os.getenv("JWT_EXPIRE_MINUTES", "1440")
)


def get_cors_origins() -> list[str]:
    """
    Origins allowed to call the API.

    Defaults cover the Vite dev server (5173) and the Live Server
    extension (5500) used by the legacy static pages.
    """

    raw = os.getenv("CORS_ORIGINS")

    if not raw:
        return [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:4173",
            "http://127.0.0.1:4173",
            "http://localhost:5500",
            "http://127.0.0.1:5500",
        ]

    return [origin.strip() for origin in raw.split(",") if origin.strip()]
