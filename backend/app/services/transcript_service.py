from app.services.meeting_service import append_transcript


def log_chat(db, room_id, username, message):

    append_transcript(
        db,
        room_id,
        f"[CHAT] {username}: {message}"
    )


def log_code(db, room_id, filename):

    append_transcript(
        db,
        room_id,
        f"[CODE] Edited {filename}"
    )


def log_file(db, room_id, filename):

    append_transcript(
        db,
        room_id,
        f"[FILE] Uploaded {filename}"
    )


def log_user_join(db, room_id, username):

    append_transcript(
        db,
        room_id,
        f"[JOIN] {username} joined."
    )


def log_user_leave(db, room_id, username):

    append_transcript(
        db,
        room_id,
        f"[LEAVE] {username} left."
    )