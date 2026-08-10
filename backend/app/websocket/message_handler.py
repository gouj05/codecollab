import json

from app.websocket.websocket_events import WebSocketEvent


def parse_message(message: str):

    try:

        data = json.loads(message)

        return data

    except Exception:

        return None


def get_event(data):

    if not data:
        return None

    return data.get("type")