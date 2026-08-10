from http.client import HTTPException

from app.models.room import Room
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.config.auth_dependency import get_current_user
from fastapi import APIRouter, Depends, HTTPException
from app.schemas.room import RoomCreate
from app.services.room_service import create_room,join_room,get_my_rooms
from app.models.room_member import RoomMember
from app.models.room_file import RoomFile
from app.models.room_document import RoomDocument

router = APIRouter(
    prefix="/rooms",
    tags=["Rooms"]
)


@router.post("/create")
def create_room_route(
    request: RoomCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    room = create_room(
        db=db,
        title=request.title,
        owner_id=int(current_user["sub"])
    )

    return {
        "id": room.id,
        "room_code": room.room_code,
        "title": room.title,
        "host_id": room.host_id,
        "created_at": str(room.created_at)
    }
def get_room_by_code(db,room_code: str):
    return (db.query(Room).filter(Room.room_code == room_code).first())

@router.post("/join/{room_code}")
def join_room_route(
    room_code: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    room = join_room(
        db=db,
        room_code=room_code,
        user_id=int(current_user["sub"])
    )

    if room is None:
        raise HTTPException(
            status_code=404,
            detail="Room not found"
        )

    return room
@router.get("/my")
def my_rooms(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    return get_my_rooms(
        db,
        int(current_user["sub"])
    )
@router.delete("/{room_id}")
def delete_room_route(
    room_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    room = (
        db.query(Room)
        .filter(
            Room.id == room_id,
            Room.host_id == int(current_user["sub"])
        )
        .first()
    )

    if room is None:
        raise HTTPException(
            status_code=404,
            detail="Room not found"
        )

    db.delete(room)
    db.commit()

    return {
        "message": "Room deleted successfully"
    }
