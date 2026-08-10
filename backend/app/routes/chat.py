from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.schemas.chat import ChatCreate
from app.services.chat_service import (
    create_chat_message,
    get_room_messages
)

router = APIRouter(
    prefix="/chat",
    tags=["Chat"]
)


@router.post("/send")
def send_message(
    chat: ChatCreate,
    db: Session = Depends(get_db)
):

    return create_chat_message(
        db,
        chat.room_id,
        1,          # Temporary sender_id
        chat.message
    )


@router.get("/{room_id}")
def get_messages(
    room_id: int,
    db: Session = Depends(get_db)
):

    return get_room_messages(
        db,
        room_id
    )