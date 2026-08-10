from fastapi import APIRouter # pyright: ignore[reportMissingImports]
from sqlalchemy.orm import Session # pyright: ignore[reportMissingImports]
from fastapi import Depends # pyright: ignore[reportMissingImports]

from app.config.database import get_db
from app.models.user import User

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


@router.get("/")
def get_users(db: Session = Depends(get_db)):

    users = db.query(User).all()

    return users

