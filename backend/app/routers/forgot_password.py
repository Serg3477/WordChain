from fastapi import APIRouter, HTTPException
from sqlalchemy import select
from starlette import status

from app.db.session import async_session
from app.db.models.user import User
from app.utils.password_hash_service import hash_password
from app.schemas.password import (
    ForgotPasswordRequest,
    ResetPasswordRequest,
    ResetPasswordResponse, ForgotPasswordResponse,
)
from app.services.password_service import (
    generate_reset_token,
    hash_reset_token,
    save_reset_token,
    get_reset_user_id,
    delete_reset_token,
)
from app.logger.logger import backend_logger


forgot_router = APIRouter()
reset_router = APIRouter()


@forgot_router.post("/forgot_password", response_model=ForgotPasswordResponse)
async def forgot_password(req: ForgotPasswordRequest):

    backend_logger.info(f"Password reset request: {req.email}")

    # Ищем пользователя по email
    async with async_session() as session:
        result = await session.execute(
            select(User).where(User.email == req.email)
        )

        user = result.scalar_one_or_none()

    # Внешний ответ ВСЕГДА одинаковый.
    response = ResetPasswordResponse(
        message="password_reset_requested"
    )

    if not user:
        backend_logger.info("Password reset requested for unknown email")
        return response

    # Google-only account
    if not user.hashed_password:
        backend_logger.info(f"Password reset skipped for Google-only user_id={user.id}")
        return response

    # генерируем reset token
    token = generate_reset_token()
    token_hash = hash_reset_token(token)
    backend_logger.info(f"Password reset token created for user_id={user.id}")

    # кладём hash token → user_id в Redis   TTL 15 минут
    await save_reset_token(
        token_hash,
        user.id
    )
    reset_link = (
        "http://127.0.0.1:5550/"
        f"?reset_token={token}"
    )
    backend_logger.warning( f"DEV PASSWORD RESET LINK: {reset_link}")
    return response


@reset_router.post("/reset_password", response_model=ResetPasswordResponse)

async def reset_password(req: ResetPasswordRequest):
    backend_logger.info("Password reset attempt")

    # 1. Frontend тоже проверит,
    # но backend обязан проверить независимо.
    if req.password != req.password_confirmation:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="password_mismatch"
        )

    # 2. Хэшируем token из ссылки.
    token_hash = hash_reset_token(req.token)

    # 3. Ищем token в Redis.
    user_id = await get_reset_user_id(token_hash)

    if user_id is None:
        backend_logger.warning("Password reset failed: " "token expired or invalid")

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="reset_token_invalid"
        )

    # 4. Загружаем пользователя. Сохраняем новый пароль для подтвержденного юзера.
    async with async_session() as session:
        user = await session.get(
            User,
            user_id
        )
        if not user:
            # Удаляем бессмысленный token.
            await delete_reset_token(token_hash)

            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="user_not_found"
            )

        # 5. ставим новый hashed_password
        user.hashed_password = hash_password(req.password)

        await session.commit()

    # 6. Token становится одноразовым. Удаляем.
    await delete_reset_token(token_hash)

    backend_logger.success(f"Password reset success: " f"user_id={user_id}")

    return ResetPasswordResponse(
        message="password_reset_success"
    )