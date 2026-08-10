from pydantic import BaseModel
from datetime import datetime


class UserBase(BaseModel):
    name: str
    email: str


class UserCreate(UserBase):
    profile_picture: str | None = None


class UserResponse(UserBase):
    id: int
    profile_picture: str | None
    created_at: datetime

    class Config:
        from_attributes = True