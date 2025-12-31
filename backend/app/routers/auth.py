from fastapi import APIRouter
from app.db.session import async_session
from app.db.models.user import User
from app.schemas.user import UserRead
from app.services.jwt_service import create_access_token
import random

auth_router = APIRouter()

# создание гостя + выдача JWT
@auth_router.post("/guest")
async def create_guest():
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

    token = create_access_token({"user_id": user.id})

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": UserRead.model_validate(user)
    }
