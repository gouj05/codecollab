from enum import Enum


class WebSocketEvent(str, Enum):

    CHAT_MESSAGE = "chat_message"

    USER_JOINED = "user_joined"

    USER_LEFT = "user_left"

    CODE_CHANGE = "code_change"

    CURSOR_MOVE = "cursor_move"

    TYPING = "typing"

    VIDEO_SIGNAL = "video_signal"

    AI_SUMMARY = "ai_summary"

    VIDEO_OFFER = "video_offer"

    VIDEO_ANSWER = "video_answer"
    
    ICE_CANDIDATE = "ice_candidate"
    
    START_SCREEN_SHARE = "start_screen_share"
    
    STOP_SCREEN_SHARE = "stop_screen_share"

    HEARTBEAT = "heartbeat"

    ONLINE_USERS = "online_users"

    LOAD_DOCUMENT = "load_document"

    EDITOR_UPDATE = "editor_update"

    