from sqlalchemy import select
from fastapi import HTTPException, status

from app.db.models.user import User
from app.services.jwt_service import create_access_token



async def ensure_email_unique(session, email: str) -> None:
    result = await session.execute(select(User).where(User.email == email))
    existing_user = result.scalar_one_or_none()

    # Email свободен — регистрация разрешена
    if existing_user is None:
        return

    # Аккаунт был создан через Google
    if existing_user.google_sub:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered with Google"
        )
    # Обычный зарегистрированный аккаунт
    raise HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail="Email already exists"
    )



def generate_token(user_id: int) -> str:
    return create_access_token({"user_id": user_id})

