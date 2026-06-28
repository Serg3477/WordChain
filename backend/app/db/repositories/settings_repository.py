from app.db.models.settings import Settings
from app.schemas.settings import NewSettingsRequest


class SettingsRepository:
    @staticmethod
    async def create(session, req: NewSettingsRequest) -> Settings:

        new = Settings(
            user_id=req.user_id
        )
        session.add(new)
        await session.flush()   # чтобы получить id и поля
        await session.commit()
        await session.refresh(new)
        return new


