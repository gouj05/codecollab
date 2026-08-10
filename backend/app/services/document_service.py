from sqlalchemy.orm import Session

from app.models.room import Room
from app.models.room_document import RoomDocument


def get_document(
    db: Session,
    room_code: str
):

    room = (
        db.query(Room)
        .filter(Room.room_code == room_code)
        .first()
    )

    if room is None:
        return None

    document = (
        db.query(RoomDocument)
        .filter(RoomDocument.room_id == room.id)
        .first()
    )

    if document is None:

        document = RoomDocument(
            room_id=room.id,
            language="python",
            code=""
        )

        db.add(document)
        db.commit()
        db.refresh(document)

    return document


def update_document(
    db: Session,
    room_code: str,
    code: str
):

    document = get_document(
        db,
        room_code
    )

    if document is None:
        return None

    document.code = code

    db.commit()

    db.refresh(document)

    return document