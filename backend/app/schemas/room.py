from pydantic import BaseModel
from datetime import datetime


class RoomCreate(BaseModel):
    title: str


class RoomResponse(BaseModel):
    id: int
    room_code: str
    title: str
    host_id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

