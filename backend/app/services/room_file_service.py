from sqlalchemy.orm import Session

from app.models.room import Room
from app.models.room_file import RoomFile


def create_file(
    db: Session,
    room_code: str,
    filename: str,
    language: str
):
    room = (
        db.query(Room)
        .filter(Room.room_code == room_code)
        .first()
    )

    if room is None:
        return None

    existing = (
        db.query(RoomFile)
        .filter(
            RoomFile.room_id == room.id,
            RoomFile.filename == filename
        )
        .first()
    )

    if existing:
        return "exists"

    file = RoomFile(
        room_id=room.id,
        filename=filename,
        language=language,
        content=""
    )

    db.add(file)
    db.commit()
    db.refresh(file)

    return file


def get_room_files(
    db: Session,
    room_code: str
):
    room = (
        db.query(Room)
        .filter(Room.room_code == room_code)
        .first()
    )

    if room is None:
        return []

    return (
        db.query(RoomFile)
        .filter(RoomFile.room_id == room.id)
        .order_by(RoomFile.filename)
        .all()
    )


def get_file(
    db: Session,
    file_id: int
):
    return (
        db.query(RoomFile)
        .filter(RoomFile.id == file_id)
        .first()
    )


def update_file(
    db: Session,
    file_id: int,
    content: str
):
    file = get_file(db, file_id)

    if file is None:
        return None

    file.content = content

    db.commit()
    db.refresh(file)

    return file


def delete_file(
    db: Session,
    file_id: int
):
    file = get_file(db, file_id)

    if file is None:
        return False

    db.delete(file)
    db.commit()

    return True

def rename_file(
    db: Session,
    file_id: int,
    filename: str
):

    file = get_file(db, file_id)

    if file is None:
        return None

    existing = (
        db.query(RoomFile)
        .filter(
            RoomFile.room_id == file.room_id,
            RoomFile.filename == filename,
            RoomFile.id != file.id
        )
        .first()
    )

    if existing:
        return "exists"

    file.filename = filename

    db.commit()
    db.refresh(file)

    return file