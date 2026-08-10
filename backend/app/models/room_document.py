from sqlalchemy import Column, Integer, Text, String, DateTime, ForeignKey
from sqlalchemy.sql import func

from app.config.database import Base


class RoomDocument(Base):

    __tablename__ = "room_documents"

    id = Column(Integer, primary_key=True)

    room_id = Column(
    Integer,
    ForeignKey(
        "rooms.id",
        ondelete="CASCADE"
    ),
    unique=True
    )

    language = Column(
        String(30),
        default="python"
    )

    code = Column(
        Text,
        default=""
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )
    