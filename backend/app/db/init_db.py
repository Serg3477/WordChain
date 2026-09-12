from app.db.base import Base


# Импорты нужны, чтобы SQLAlchemy зарегистрировала модели
# в соответствующих metadata.
from app.db import models as main_models  # noqa: F401

from sqlalchemy.orm import DeclarativeBase

from app.db.session import engine


class Base(DeclarativeBase):
    pass


async def init_models():
    # Важно: модели должны быть импортированы до create_all(),
    # иначе Base.metadata о них не знает.
    import app.db.models

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def dispose_engines():
    await engine.dispose()

