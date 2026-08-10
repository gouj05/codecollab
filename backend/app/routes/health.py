from fastapi import APIRouter
from sqlalchemy import text

from app.config.database import engine

router = APIRouter()


@router.get("/health")
def health_check():

    try:

        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {
            "status": "OK",
            "database": "Connected"
        }

    except Exception as e:

        return {
            "status": "ERROR",
            "database": str(e)
        }