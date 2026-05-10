from datetime import datetime
from sqlalchemy import select
from app.db.models.set import Set

class SetRepository:

    @staticmethod
    async def create(session, user_id: int, name: str, description: str):
        obj = Set(
            user_id=user_id,
            name=name,
            description=description,
            created_at=datetime.now(),
        )
        session.add(obj)
        await session.commit()
        await session.refresh(obj)
        return obj

    @staticmethod
    async def get_last_set_number(session, user_id: int) -> int:
        """
        Возвращает номер последнего сета пользователя.
        Если сетов нет — возвращает 0.
        """
        result = await session.execute(
            select(Set)
            .where(Set.user_id == user_id)
            .order_by(Set.id.desc())
            .limit(1)
        )
        last_set = result.scalar_one_or_none()

        if not last_set:
            return 0

        # имя вида "Set-12"
        if last_set.name.startswith("Set-"):
            try:
                return int(last_set.name.split("-")[1])
            except:
                return 0

        return 0
