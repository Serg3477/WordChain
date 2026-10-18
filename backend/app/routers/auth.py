from fastapi import APIRouter, Depends
from fastapi import HTTPException, status
from fastapi.concurrency import run_in_threadpool
import random
from uuid import uuid4
from sqlalchemy import select
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from app.db.session import async_session
from app.db.models.user import User
from app.routers.dependencies import get_current_user
from app.schemas.user import UserRead, LoginResponse, GoogleAuthRequest
from app.services.jwt_service import create_access_token
from app.db.config import settings
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
            avatar_url="user-icon.png",
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

        guest_email = f"guest- " + str(uuid4())[:8] + "@example.com"
        user.email = guest_email

        # Сохраняем email в БД
        await session.commit()
        await session.refresh(user)

    backend_logger.info(f"Guest user created: ID: {user.id}, nick: {user.nickname}, email: {user.email}")
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": UserRead.model_validate(user)
    }

@auth_router.get("/me", response_model=UserRead)
async def get_me(user = Depends(get_current_user)):
    backend_logger.info(f"Get current user. {user.id} - {user.nickname}")
    return user

@auth_router.post("/auth/google", response_model=LoginResponse)
async def google_auth(req: GoogleAuthRequest):
    backend_logger.info("Google authentication attempt")
    account_linked = False

    # 1. Проверяем Google ID token
    try:
        google_info = await run_in_threadpool(
            id_token.verify_oauth2_token,
            req.credential,
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID,
        )
    except ValueError as e:
        backend_logger.warning(f"Invalid Google token: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="invalid_google_token",
        )

    google_sub = google_info.get("sub")
    email = google_info.get("email")
    email_verified = google_info.get("email_verified", False)
    name = google_info.get("name")
    picture = google_info.get("picture")

    if not google_sub:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="google_sub_missing",
        )

    if not email or not email_verified:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="google_email_not_verified",
        )

    async with async_session() as session:

        # 2. Сначала ищем именно по Google sub
        result = await session.execute(
            select(User).where(User.google_sub == google_sub)
        )
        user = result.scalar_one_or_none()

        # 3. Такой Google account ещё не привязан
        if not user:
            if req.mode == "login":
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="google_account_not_found")

            if not req.terms_accepted:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="terms_not_accepted")

            # Проверяем, нет ли обычного аккаунта с таким email
            result = await session.execute(
                select(User).where(User.email == email)
            )
            user = result.scalar_one_or_none()

            # Такой email уже есть — связываем существующий аккаунт с Google
            if user:
                # Если к этому email каким-то образом уже привязан ДРУГОЙ Google account.
                if user.google_sub and user.google_sub != google_sub:
                    backend_logger.warning(
                        f"Google account conflict for email={email}"
                    )

                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail="google_account_conflict",
                    )

                # Связываем существующий account с Google. НЕ меняем: user.hashed_password, user.nickname, user.avatar_url, Settings
                user.google_sub = google_sub
                user.is_guest = False

                await session.commit()
                await session.refresh(user)

                backend_logger.info(
                    f"Google linked to existing user: {user.id}"
                )
                account_linked = True
            else:
                # 4. Совсем новый пользователь
                preferred_nickname = (
                    name.strip()
                    if name and name.strip()
                    else email.split("@")[0]
                )
                preferred_nickname = preferred_nickname[:50]

                # nickname UNIQUE, поэтому Google name нельзя использовать вслепую
                result = await session.execute(
                    select(User.id).where(
                        User.nickname == preferred_nickname
                    )
                )
                nickname_exists = result.scalar_one_or_none()

                if nickname_exists:
                    suffix = google_sub[-6:]
                    preferred_nickname = (
                        f"{preferred_nickname[:43]}-{suffix}"
                    )

                user = User(
                    nickname=preferred_nickname,
                    email=email,
                    google_sub=google_sub,
                    hashed_password=None,
                    avatar_url=picture or "default_user.jpg",
                    is_guest=False,
                    is_premium=False,
                )

                session.add(user)
                await session.commit()
                await session.refresh(user)

                backend_logger.success(
                    f"Google user created: "
                    f"{user.id} - {user.nickname}"
                )

        # Пользователь уже был связан с Google
        else:
            backend_logger.info(
                f"Existing Google user found: "
                f"{user.id} - {user.nickname}"
            )

        # 5. Выпускаем уже НАШ WordChain JWT
        new_token = create_access_token({
            "user_id": user.id
        })

        backend_logger.success(
            f"Google authentication success: "
            f"{user.id} - {user.nickname}"
        )

        return LoginResponse(
            id=user.id,
            nickname=user.nickname,
            avatar_url=user.avatar_url,
            email=user.email,
            token=new_token,
            is_guest=user.is_guest,
            is_premium=user.is_premium,
            account_linked=account_linked
        )

