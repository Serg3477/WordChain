import os
from fastapi import APIRouter, HTTPException
from sqlalchemy import select, text, func
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
from app.services.email_service import send_password_reset_email
from app.logger.logger import backend_logger


forgot_router = APIRouter()
reset_router = APIRouter()


@forgot_router.post("/forgot_password", response_model=ForgotPasswordResponse)
async def forgot_password(req: ForgotPasswordRequest):

    backend_logger.info(f"Password reset request: {req.email}")
    backend_logger.info(f"Forgot email repr={req.email!r}, len={len(req.email)}")

    # Ищем пользователя по email
    async with async_session() as session:
        db_info = await session.execute(
            text("""
                SELECT
                    current_database(),
                    current_user,
                    inet_server_addr(),
                    inet_server_port()
            """)
        )
        backend_logger.info(
            f"DB connection: {db_info.one()}"
        )

        email = req.email.strip().lower()
        result = await session.execute(
            select(User).where(
                func.lower(func.trim(User.email)) == email
            )
        )
        user = result.scalar_one_or_none()

    # Внешний ответ ВСЕГДА одинаковый.
    response = ForgotPasswordResponse(
        message=(
                "If an account with this email exists, "
                "a password reset link has been sent."
            )
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

    # Отсылаем ссылку на Email пользователя для сброса пароля и задания нового через Resend
    frontend_url = os.getenv(
        "FRONTEND_URL",
        "http://127.0.0.1:5550",
    )

    reset_url = f"{frontend_url}/?reset_token={token}"
    try:
        await send_password_reset_email(
            user.email,
            reset_url,
        )
        backend_logger.info(f"Password reset email: {user.email}  sent for user_id={user.id}")

    except Exception:
        backend_logger.exception(f"Failed to send password reset email: {user.email} for user_id={user.id}")
        await delete_reset_token(token_hash)

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


