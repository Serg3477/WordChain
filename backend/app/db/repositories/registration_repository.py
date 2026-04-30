from app.db.models.user import User


class RegistrationRepository:

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
