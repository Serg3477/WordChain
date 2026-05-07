from fastapi import APIRouter, Depends
import random

from app.db.session import async_session
from app.db.models.user import User
from app.routers.dependencies import get_current_user
from app.schemas.user import UserRead
from app.services.jwt_service import create_access_token
from app.logger.logger import backend_logger


auth_router = APIRouter()

# создание гостя + выдача JWT
@auth_router.post("/guest")
async def create_guest():
    backend_logger.info(f"Create guest attempt.")
    nickname = f"Guest-{random.randint(1000, 9999)}"

    async with async_session() as session:
        user = User(
            is_guest=True,
            nickname=nickname,
            avatar_url="default.png",
            is_premium=False
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
    try:
        token = create_access_token({"user_id": user.id})
        backend_logger.success(f"Creating guest token OK: {user.id}")
    except Exception as e:
        backend_logger.error(f"Creation guest token failed: {user.id}, error={e}")
        raise

    backend_logger.info(f"Guest user created: ID: {user.id}, nick: {user.nickname}")
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": UserRead.model_validate(user)
    }

@auth_router.get("/me", response_model=UserRead)
async def get_me(user = Depends(get_current_user)):
    backend_logger.info(f"Get current user. {user.id} - {user.nickname}")
    return user

