import random
import string
from sqlalchemy.orm import Session

from app.models.room import Room


def generate_unique_room_code(db: Session):

    while True:

        code = ''.join(
            random.choices(
                string.ascii_uppercase + string.digits,
                k=8
            )
        )

        room = db.query(Room).filter(
            Room.room_code == code
        ).first()

        if not room:
            return code