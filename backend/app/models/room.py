from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.config.database import Base


class Room(Base):
    __tablename__ = "rooms"
    id = Column(Integer, primary_key=True, index=True)    
    room_code = Column(String(10), unique=True, nullable=False, index=True)    
    title = Column(String(150), nullable=False)    
    host_id = Column(Integer, ForeignKey("users.id"), nullable=False)    
    is_active = Column(Boolean, default=True)    
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    host = relationship("User", back_populates="owned_rooms")
    members = relationship("RoomMember", back_populates="room")
    files = relationship(
    "RoomFile",
    back_populates="room",
    cascade="all, delete-orphan")