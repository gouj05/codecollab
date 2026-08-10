from sqlalchemy.orm import Session

from app.models.chat_message import ChatMessage


def create_chat_message(
    db: Session,
    room_id: int,
    sender_id: int,
    message: str
):

    chat = ChatMessage(
        room_id=room_id,
        sender_id=sender_id,
        message=message
    )

    db.add(chat)

    db.commit()

    db.refresh(chat)

    return chat


def get_room_messages(
    db: Session,
    room_id: int
):

    return (
        db.query(ChatMessage)
        .filter(ChatMessage.room_id == room_id)
        .order_by(ChatMessage.created_at)
        .all()
    )