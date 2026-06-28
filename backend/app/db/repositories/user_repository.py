from sqlalchemy import select
from app.db.models.user import User


class UserRepository:

    @staticmethod
    async def create(session, nickname, email, hashed_password, avatar_url, is_guest, is_premium):
        obj = User(
            nickname=nickname,
            email=email,
            hashed_password=hashed_password,
            avatar_url=avatar_url,
            is_guest=is_guest,
            is_premium=is_premium
        )
        session.add(obj)
        await session.commit()
        await session.refresh(obj)
        return obj

    @staticmethod
    async def delete(session, email) -> bool:
        result = await session.execute(select(User).where(User.email == email))
        obj = result.scalar_one_or_none()
        if not obj:
            return False
        await session.delete(obj)
        await session.commit()
        return True

