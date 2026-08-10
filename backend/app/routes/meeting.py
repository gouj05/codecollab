from fastapi import APIRouter
from fastapi import Depends
from app.services.ai_service import generate_mom
import json
from sqlalchemy.orm import Session

from app.config.database import get_db

from app.services.meeting_service import *

router = APIRouter(
    prefix="/meeting",
    tags=["Meeting"]
)
@router.post("/transcript")
def add_transcript(
    room_id: int,
    text: str,
    db: Session = Depends(get_db)
):

    return append_transcript(
        db,
        room_id,
        text
    )
@router.get("/{room_id}")
def get_meeting(
    room_id: int,
    db: Session = Depends(get_db)
):

    return get_or_create_summary(
        db,
        room_id
    )

@router.post("/{room_id}/generate")
def generate_summary(
    room_id: int,
    db: Session = Depends(get_db)
):

    meeting = get_or_create_summary(
        db,
        room_id
    )

    ai = generate_mom(
        meeting.transcript
    )

    data = json.loads(ai)

    save_summary(

        db,

        room_id,

        data["summary"],

        "\n".join(data["action_items"]),

        "\n".join(data["decisions"]),

        "\n".join(data["questions"])

    )

    return data