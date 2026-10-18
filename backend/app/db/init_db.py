from app.db.base import Base
from app.db.session import engine

# Важно: импортируем модели,
# чтобы они зарегистрировались в Base.metadata
from app.db import models as main_models  # noqa: F401


async def init_models():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def dispose_engines():
    await engine.dispose()