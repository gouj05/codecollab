from sqlalchemy.orm import Session
from app.models.room import Room
from app.models.room_member import RoomMember
from app.utils.room_generator import generate_unique_room_code
from app.models.room_file import RoomFile


def create_room(db: Session, title: str, owner_id: int):

    room_code = generate_unique_room_code(db)

    room = Room(
    title=title,
    room_code=room_code,
    host_id=owner_id
)

    db.add(room)
    db.commit()
    db.refresh(room)

    default_file = RoomFile(
    room_id=room.id,
    filename="main.py",
    language="python",
    content='print("Hello CodeCollab AI!")')
    db.add(default_file)
    db.commit()

    member = RoomMember(
        room_id=room.id,
        user_id=owner_id
    )

    db.add(member)
    db.commit()

    return room

def join_room(db: Session, room_code: str, user_id: int):

    room = db.query(Room).filter(
        Room.room_code == room_code,
        Room.is_active == True
    ).first()

    if room is None:
        return None

    existing = db.query(RoomMember).filter(
        RoomMember.room_id == room.id,
        RoomMember.user_id == user_id
    ).first()

    if existing:
        return room

    member = RoomMember(
        room_id=room.id,
        user_id=user_id
    )

    db.add(member)
    db.commit()

    return room

def get_my_rooms(db, user_id: int):

    return (
        db.query(Room)
        .filter(Room.host_id == user_id)
        .order_by(Room.created_at.desc())
        .all()
    )
def get_room_by_code(db: Session, room_code: str):

    return (
        db.query(Room)
        .filter(
            Room.room_code == room_code,
            Room.is_active == True
        )
        .first()
    )
def delete_room(db: Session, room_id: int, user_id: int):

    room = (
        db.query(Room)
        .filter(
            Room.id == room_id,
            Room.host_id == user_id
        )
        .first()
    )

    if room is None:
        return False

    db.query(RoomMember).filter(
        RoomMember.room_id == room.id
    ).delete()

    db.query(RoomFile).filter(
        RoomFile.room_id == room.id
    ).delete()

    db.delete(room)

    db.commit()

    return True