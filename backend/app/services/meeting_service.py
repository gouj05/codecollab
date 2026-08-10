from sqlalchemy.orm import Session

from app.models.meeting_summary import MeetingSummary


def get_or_create_summary(db, room_id):

    summary = db.query(MeetingSummary).filter(
        MeetingSummary.room_id == room_id
    ).first()

    if summary:
        return summary

    summary = MeetingSummary(room_id=room_id)

    db.add(summary)
    db.commit()
    db.refresh(summary)

    return summary


def append_transcript(db, room_id, text):

    meeting = get_or_create_summary(db, room_id)

    meeting.transcript += "\n" + text

    db.commit()

    return meeting


def save_summary(
        db,
        room_id,
        summary,
        actions,
        decisions,
        questions
):

    meeting = get_or_create_summary(db, room_id)

    meeting.summary = summary

    meeting.action_items = actions

    meeting.decisions = decisions

    meeting.questions = questions

    db.commit()

    return meeting