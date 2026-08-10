from pydantic import BaseModel


class FileCreate(BaseModel):
    room_code: str
    filename: str
    language: str


class FileUpdate(BaseModel):
    content: str


class FileRename(BaseModel):
    filename: str