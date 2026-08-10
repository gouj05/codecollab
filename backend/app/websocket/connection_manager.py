from fastapi import WebSocket
from collections import defaultdict


class ConnectionManager:

    def __init__(self):

        # room_code -> list of users
        self.active_connections = defaultdict(list)

    async def connect(
        self,
        room_code: str,
        websocket: WebSocket,
        user: dict
    ):

        await websocket.accept()

        self.active_connections[room_code].append({

            "websocket": websocket,
            "user": user

        })

    def disconnect(
        self,
        room_code: str,
        websocket: WebSocket
    ):

        users = self.active_connections.get(room_code, [])

        self.active_connections[room_code] = [

            u for u in users

            if u["websocket"] != websocket

        ]

        if len(self.active_connections[room_code]) == 0:

            del self.active_connections[room_code]

    async def send_personal_message(
        self,
        message: str,
        websocket: WebSocket
    ):

        await websocket.send_text(message)

    async def broadcast(
        self,
        room_code: str,
        message: str
    ):

        for connection in self.active_connections.get(room_code, []):

            await connection["websocket"].send_text(message)

    async def broadcast_except_sender(
        self,
        room_code: str,
        sender: WebSocket,
        message: str
    ):

        for connection in self.active_connections.get(room_code, []):

            if connection["websocket"] == sender:
                continue

            await connection["websocket"].send_text(message)
    async def send_to_user(self, room_code: str, user_id: int, message: str):
        users = self.active_connections.get(room_code, [])
        for connection in users:

            if connection["user"]["id"] == user_id:
    
                await connection["websocket"].send_text(message)
    
                return
    def get_online_users(
        self,
        room_code: str
    ):

        return [

            user["user"]

            for user in self.active_connections.get(room_code, [])

        ]


manager = ConnectionManager()