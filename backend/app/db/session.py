from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.db.config import settings

engine = create_async_engine(
    settings.database_url,
    echo=True,  # вывод SQL-запросов
)

async_session = async_sessionmaker(
    engine,
    expire_on_commit=False,
    class_=AsyncSession,
)

