from fastapi import APIRouter
from app.db.session import async_session
from app.schemas.user import RegistrationRequest, RegistrationResponse
from app.db.repositories.user_repository import UserRepository
from app.services.registration_service import (
    ensure_email_unique,
    hash_password,
    generate_token,
)

registration_router = APIRouter()

@registration_router.post("/register", response_model=RegistrationResponse)
async def registration(req: RegistrationRequest):
    async with async_session() as session:
        await ensure_email_unique(session, req.email)

        user = await UserRepository.create(
            session=session,
            nickname=req.name,
            email=req.email,
            hashed_password=hash_password(req.password),
            avatar_url="default_user.jpg",
            is_guest=False,
            is_premium=False,
        )

    token = generate_token(user.id)

    return RegistrationResponse(
        nickname=user.nickname,
        avatar_url=user.avatar_url,
        email=user.email,
        token=token,
        is_guest=user.is_guest,
        is_premium=user.is_premium,
    )
