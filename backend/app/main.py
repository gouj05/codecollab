from fastapi import FastAPI, Request  # type: ignore[import]
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from starlette.middleware.sessions import SessionMiddleware

from app.config.database import Base, engine
from app.config.settings import settings
from app.models.user import User
from app.routes.health import router as health_router
from app.routes.users import router as user_router
from app.routes.auth import router as auth_router
from app.routes.rooms import router as room_router
from app.routes.chat import router as chat_router
from app.routes.files import router as files_router
from app.routes.execution import router as execution_router
from app.routes.ai import router as ai_router
from app.websocket.room_socket import router as websocket_router
from app.routes import meeting

app = FastAPI(
    title="CodeCollab AI",
    description="AI Assisted Pair Programming Platform",
    version="1.0.0"
)
Base.metadata.create_all(bind=engine)
templates = Jinja2Templates(
    directory="app/templates"
)

app.mount(
    "/static",
    StaticFiles(directory="app/static"),
    name="static"
)

app.add_middleware(
    SessionMiddleware,
    secret_key=settings.SECRET_KEY,
    same_site="lax",
    https_only=False
)



app.include_router(health_router)
app.include_router(user_router)
app.include_router(auth_router)
app.include_router(room_router)
app.include_router(websocket_router)
app.include_router(chat_router)
app.include_router(files_router)
app.include_router(execution_router)
app.include_router(ai_router)
app.include_router(meeting.router)
@app.get("/")
def landing_page(request: Request):

    return templates.TemplateResponse(
    request=request,
    name="index.html"
)

@app.get("/login")
def login_page(request: Request):

    return templates.TemplateResponse(
    request=request,
    name="login.html"
)


@app.get("/dashboard")
def dashboard_page(request: Request):

    return templates.TemplateResponse(
    request=request,
    name="dashboard.html"
)


@app.get("/room")
def room_page(request: Request):

    return templates.TemplateResponse(
    request=request,
    name="room.html"
)

