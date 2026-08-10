from pydantic import BaseModel
from datetime import datetime


class ChatCreate(BaseModel):
    room_id: int
    message: str


class ChatResponse(BaseModel):
    id: int
    room_id: int
    sender_id: int
    message: str
    created_at: datetime

    class Config:
        from_attributes = True