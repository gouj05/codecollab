from sqlalchemy import Column, Integer, ForeignKey, Text, DateTime
from sqlalchemy.sql import func

from app.config.database import Base


class MeetingSummary(Base):

    __tablename__ = "meeting_summaries"

    id = Column(Integer, primary_key=True)

    room_id = Column(
        Integer,
        ForeignKey("rooms.id", ondelete="CASCADE"),
        unique=True
    )

    transcript = Column(
        Text,
        default=""
    )

    summary = Column(
        Text,
        default=""
    )

    action_items = Column(
        Text,
        default=""
    )

    decisions = Column(
        Text,
        default=""
    )

    questions = Column(
        Text,
        default=""
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )
    bugs = Column(Text)
    suggestions = Column(Text)