from sqlalchemy.orm import Session

from app.models.room import Room
from app.models.chat_message import ChatMessage


def save_chat_message(
    db: Session,
    room_code: str,
    sender_id: int,
    message: str
):

    print("=" * 50)
    print("ROOM CODE RECEIVED:", room_code)

    room = (
        db.query(Room)
        .filter(Room.room_code == room_code)
        .first()
    )

    print("ROOM FOUND:", room)

    if room is None:
        return None

    chat = ChatMessage(
        room_id=room.id,
        sender_id=sender_id,
        message=message
    )

    db.add(chat)
    db.commit()
    db.refresh(chat)

    return chat