import json
import traceback

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.room_service import get_room_by_code
from app.websocket.connection_manager import manager
from app.websocket.message_handler import parse_message, get_event
from app.websocket.websocket_events import WebSocketEvent

from app.config.websocket_auth import verify_websocket_token
from app.config.database import SessionLocal

from app.services.user_service import get_user_by_id
from app.services.websocket_chat_service import save_chat_message
from app.services.document_service import (
    get_document,
    update_document
)
from app.services.room_file_service import update_file

router = APIRouter()


@router.websocket("/ws/{room_code}")
async def websocket_endpoint(
    websocket: WebSocket,
    room_code: str
):

    token = websocket.query_params.get("token")

    if token is None:
        await websocket.close(code=1008)
        return

    payload = verify_websocket_token(token)

    if payload is None:
        await websocket.close(code=1008)
        return

    user_id = int(payload["sub"])

    db = SessionLocal()

    try:

        user = get_user_by_id(
            db,
            user_id
        )

        if user is None:
            await websocket.close(code=1008)
            return

        current_user = {

            "id": user.id,
            "name": user.name,
            "email": user.email

        }

    finally:

        db.close()

    await manager.connect(

        room_code,
        websocket,
        current_user

    )

    db = SessionLocal()

    try:

        document = get_document(
            db,
            room_code

        )

    finally:

        db.close()
     
    await websocket.send_json({

        "type": WebSocketEvent.LOAD_DOCUMENT,
        "language": document.language,
        "code": document.code

    })

    db = SessionLocal()
    try:
        room = get_room_by_code(db,room_code)

    finally:
        db.close()

    await websocket.send_json({
        "type": WebSocketEvent.ONLINE_USERS,        
        "users": manager.get_online_users(room_code),        
        "current_user": current_user,        
        "host_id": room.host_id
    })
    print("ONLINE USERS:", manager.get_online_users(room_code))
    await manager.broadcast(
    room_code,
    json.dumps({
        "type": WebSocketEvent.ONLINE_USERS,
        "users": manager.get_online_users(room_code)
    })

    )

    try:

        while True:

            message = await websocket.receive_text()

            print("RAW:", message)

            data = parse_message(message)

            print("DATA:", data)

            event = get_event(data)

            print("EVENT:", event)

            # ==================================================
            # CHAT MESSAGE
            # ==================================================

            if event == WebSocketEvent.CHAT_MESSAGE:

                db = SessionLocal()

                try:

                    chat = save_chat_message(

                        db=db,

                        room_code=room_code,

                        sender_id=user_id,

                        message=data["data"]["message"]

                    )

                    if chat is None:

                        await websocket.send_json({

                            "type": "error",

                            "message": "Room not found"

                        })

                        continue

                    timestamp = str(chat.created_at)

                finally:

                    db.close()

                response = {

                    "type": WebSocketEvent.CHAT_MESSAGE,

                    "room": room_code,

                    "sender": current_user,

                    "data": {

                        "message": data["data"]["message"]

                    },

                    "timestamp": timestamp

                }

                await manager.broadcast(

                    room_code,

                    json.dumps(response)

                )

            # ==================================================
            # LIVE FILE UPDATE
            # ==================================================

            elif event == WebSocketEvent.EDITOR_UPDATE:

                db = SessionLocal()

                try:

                    file_id = data["data"]["file_id"]

                    content = data["data"]["content"]

                    file = update_file(

                        db,

                        file_id,

                        content

                    )

                    if file is None:

                        await websocket.send_json({

                            "type": "error",

                            "message": "File not found"

                        })

                        continue
                finally:

                    db.close()

                response = {

                    "type": WebSocketEvent.EDITOR_UPDATE,

                    "room": room_code,

                    "sender": {

                        "id": current_user["id"],

                        "name": current_user["name"]

                    },

                    "data": {

                        "file_id": file_id,

                        "content": content

                    }

                }

                await manager.broadcast(

                    room_code,

                    json.dumps(response)

                )

            # ==================================================
            # DOCUMENT UPDATE
            # ==================================================

            elif event == WebSocketEvent.CODE_CHANGE:

                db = SessionLocal()

                try:

                    document = update_document(

                        db,

                        room_code,

                        data["data"]["code"]

                    )

                finally:

                    db.close()

                response = {

                    "type": WebSocketEvent.CODE_CHANGE,

                    "room": room_code,

                    "sender": current_user,

                    "data": {

                        "code": document.code

                    }

                }

                await manager.broadcast(

                    room_code,

                    json.dumps(response)

                )

            # ==================================================
            # VIDEO OFFER
            # ==================================================

            elif event == WebSocketEvent.VIDEO_OFFER:

                receiver = data["target_user_id"]

                await manager.send_to_user(

                    room_code,

                    receiver,

                    json.dumps({

                        "type": WebSocketEvent.VIDEO_OFFER,

                        "sender": current_user,

                        "offer": data["offer"]

                    })

                )

            # ==================================================
            # VIDEO ANSWER
            # ==================================================

            elif event == WebSocketEvent.VIDEO_ANSWER:

                receiver = data["target_user_id"]

                await manager.send_to_user(

                    room_code,

                    receiver,

                    json.dumps({

                        "type": WebSocketEvent.VIDEO_ANSWER,

                        "sender": current_user,

                        "answer": data["answer"]

                    })

                )

            # ==================================================
            # ICE CANDIDATE
            # ==================================================

            elif event == WebSocketEvent.ICE_CANDIDATE:

                receiver = data["target_user_id"]

                await manager.send_to_user(

                    room_code,

                    receiver,

                    json.dumps({

                        "type": WebSocketEvent.ICE_CANDIDATE,

                        "sender": current_user,

                        "candidate": data["candidate"]

                    })

                )
                        # ==================================================
            # UNKNOWN EVENT
            # ==================================================

            else:

                await websocket.send_json({

                    "type": "error",

                    "message": "Unknown event"

                })

    # ==========================================================
    # CLIENT DISCONNECTED
    # ==========================================================

    except WebSocketDisconnect:

        manager.disconnect(

            room_code,

            websocket

        )

        db = SessionLocal()

        try:
            room = get_room_by_code(db, room_code)
        finally:
            db.close()
        
        users = manager.get_online_users(room_code)
        
        for connection in manager.active_connections.get(room_code, []):
        
            await connection["websocket"].send_text(
                json.dumps({
                    "type": WebSocketEvent.ONLINE_USERS,
                    "users": users,
                    "current_user": connection["user"],
                    "host_id": room.host_id if room else None
                })
            )
    # ==========================================================
    # OTHER ERRORS
    # ==========================================================

    except Exception:

        traceback.print_exc()

        manager.disconnect(

            room_code,

            websocket

        )

        db = SessionLocal()

        try:
            room = get_room_by_code(db, room_code)
        finally:
            db.close()
        
        users = manager.get_online_users(room_code)
        
        for connection in manager.active_connections.get(room_code, []):
        
            await connection["websocket"].send_text(
                json.dumps({
                    "type": WebSocketEvent.ONLINE_USERS,
                    "users": users,
                    "current_user": connection["user"],
                    "host_id": room.host_id if room else None
                })
            )