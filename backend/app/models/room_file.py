from sqlalchemy import Column, Integer, String, ForeignKey, Text, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.config.database import Base


class RoomFile(Base):

    __tablename__ = "room_files"

    id = Column(Integer, primary_key=True, index=True)

    room_id = Column(
        Integer,
        ForeignKey("rooms.id", ondelete="CASCADE")
    )

    filename = Column(String(255))

    language = Column(String(50))

    content = Column(
        Text,
        default=""
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )

    room = relationship(
        "Room",
        back_populates="files"
    )