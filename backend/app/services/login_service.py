from sqlalchemy import select
from fastapi import HTTPException, status
from passlib.context import CryptContext
from app.db.models.user import User
from app.logger.logger import backend_logger


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def get_user_by_email(session, email: str) -> User:
    result = await session.execute(select(User).where(User.email == email))
    existing_user = result.scalar_one_or_none()
    backend_logger.info(f"User found: {existing_user}")
    if not existing_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",)
    return existing_user

async def check_by_password( plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)