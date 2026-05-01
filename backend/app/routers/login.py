from fastapi import HTTPException, status
from fastapi import APIRouter
from app.db.session import async_session
from app.schemas.user import LoginRequest, LoginResponse
from app.services.jwt_service import create_access_token
from app.services.login_service import (
    get_user_by_email,
    check_by_password
)

login_router = APIRouter()
@login_router.post("/login", response_model=LoginResponse)
async def login(req: LoginRequest):
    async with async_session() as session:
        user = await get_user_by_email(session, req.email)
        is_valid = await check_by_password(req.password, user.hashed_password)
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )
        new_token = create_access_token({"user_id": user.id})

        return  LoginResponse(
            nickname=user.nickname,
            avatar_url=user.avatar_url,
            email=user.email,
            token=new_token,
            is_guest=user.is_guest,
            is_premium=user.is_premium
        )
