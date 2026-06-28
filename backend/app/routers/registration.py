from fastapi import APIRouter, HTTPException
from app.db.session import async_session
from app.schemas.user import RegistrationRequest, RegistrationResponse
from app.db.repositories.user_repository import UserRepository
from app.logger.logger import backend_logger
from app.services.registration_service import (
    ensure_email_unique,
    hash_password,
    generate_token,
)

registration_router = APIRouter()

@registration_router.post("/register", response_model=RegistrationResponse)
async def registration(req: RegistrationRequest):
    backend_logger.info(f"Registration attempt: {req.email}")
    async with async_session() as session:
        await ensure_email_unique(session, req.email)
        try:
            user = await UserRepository.create(
                session=session,
                nickname=req.name,
                email=req.email,
                hashed_password=hash_password(req.password),
                avatar_url="default_user.jpg",
                is_guest=False,
                is_premium=False,
            )
        except Exception as e:
            backend_logger.exception(f"Unhandled error: {e}")
            raise

        try:
            token = generate_token(user.id)
            backend_logger.success(f"Generate token OK: {user.id} - {user.nickname}")
        except Exception as e:
            backend_logger.error(f"Generation failed: {user.id} - {user.nickname}, error={e}")
            raise
    backend_logger.info(f"Registration success:  {user.id} - {user.nickname}")
    return RegistrationResponse(
        id=user.id,
        nickname=user.nickname,
        avatar_url=user.avatar_url,
        email=user.email,
        token=token,
        is_guest=user.is_guest,
        is_premium=user.is_premium,
    )
