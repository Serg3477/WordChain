from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.db.config import settings


engine_db = create_async_engine(
    settings.engine_database_url,
    echo=False,
    pool_pre_ping=True,
)

engine_async_session = async_sessionmaker(
    bind=engine_db,
    class_=AsyncSession,
    expire_on_commit=False,
)