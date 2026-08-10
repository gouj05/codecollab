from sqlalchemy import Column, Integer, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.config.database import Base


class RoomMember(Base):
    __tablename__ = "room_members"

    id = Column(Integer, primary_key=True)

    room_id = Column(
    Integer,
    ForeignKey(
        "rooms.id",
        ondelete="CASCADE"
    ),
    nullable=False
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    joined_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    room = relationship("Room", back_populates="members")
    user = relationship("User", back_populates="joined_rooms")