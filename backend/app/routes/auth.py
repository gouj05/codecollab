from fastapi import APIRouter, Depends
from fastapi.responses import RedirectResponse
from starlette.requests import Request

from sqlalchemy.orm import Session

from authlib.integrations.starlette_client import OAuth

from app.config.settings import settings
from app.config.database import get_db
from app.models.user import User
from app.config.security import create_access_token
from app.config.auth_dependency import get_current_user


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


oauth = OAuth()

oauth.register(
    name="google",
    client_id=settings.GOOGLE_CLIENT_ID,
    client_secret=settings.GOOGLE_CLIENT_SECRET,
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={
        "scope": "openid email profile"
    }
)


@router.get("/login")
async def login(request: Request):

    return await oauth.google.authorize_redirect(
        request,
        settings.GOOGLE_REDIRECT_URI
    )


@router.get("/callback")
async def callback(
    request: Request,
    db: Session = Depends(get_db)
):

    token = await oauth.google.authorize_access_token(request)

    user_info = token["userinfo"]

    email = user_info["email"]

    user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if user is None:

        user = User(
            name=user_info["name"],
            email=user_info["email"],
            profile_picture=user_info["picture"]
        )

        db.add(user)
        db.commit()
        db.refresh(user)

    jwt_token = create_access_token(
        {
            "sub": str(user.id),
            "email": user.email
        }
    )

    return RedirectResponse(
        url=f"/dashboard?token={jwt_token}"
    )


@router.get("/me")
def me(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    user = (
        db.query(User)
        .filter(User.id == int(current_user["sub"]))
        .first()
    )

    if user is None:
        return {
            "message": "User not found"
        }

    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "picture": user.profile_picture
    }