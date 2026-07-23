from sqlalchemy import text

from app.db.base import Base
from app.db.engine_base import EngineBase
from app.db.engine_session import engine_db
from app.db.session import engine

# Импорты нужны, чтобы SQLAlchemy зарегистрировала модели
# в соответствующих metadata.
from app.db import models as main_models  # noqa: F401
from app.db.models import engine as engine_models  # noqa: F401


async def init_models() -> None:
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

    async with engine_db.begin() as connection:
        await connection.run_sync(EngineBase.metadata.create_all)


    # await show_tables(engine, "WordChain")
    # await show_tables(engine_db, "Engine")


async def dispose_engines() -> None:
    await engine.dispose()
    await engine_db.dispose()

async def show_tables(db_engine, title):

    async with db_engine.begin() as conn:
        result = await conn.execute(text("""
            SELECT tablename
            FROM pg_tables
            WHERE schemaname = 'public'
            ORDER BY tablename;
        """))

        print(f"\n{title}")

        for table in result.scalars():
            print(f"   • {table}")