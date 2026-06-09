import re
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
        Возвращает максимальный номер сета вида "Set - X".
        Если таких сетов нет — возвращает 0.
        """
        SET_PATTERN = re.compile(r"^Set\s*-\s*(\d+)$")

        # 1. Получаем ВСЕ сеты пользователя
        result = await session.execute(
            select(Set.name).where(Set.user_id == user_id)
        )
        names = [row[0] for row in result.all()]

        max_number = 0

        # 2. Ищем только те, что подходят под шаблон "Set - X"
        for name in names:
            match = SET_PATTERN.match(name)
            if match:
                num = int(match.group(1))
                if num > max_number:
                    max_number = num

        return max_number