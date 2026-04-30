from sqlalchemy import select
from fastapi import HTTPException, status
from passlib.context import CryptContext

from app.db.models.user import User
from app.services.jwt_service import create_access_token


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def ensure_email_unique(session, email: str) -> None:
    result = await session.execute(select(User).where(User.email == email))
    existing_user = result.scalar_one_or_none()
    if existing_user is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered"
        )


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def generate_token(user_id: int) -> str:
    return create_access_token({"user_id": user_id})