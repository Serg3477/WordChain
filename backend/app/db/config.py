from urllib.parse import quote_plus
from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    DB_HOST: str
    DB_PORT: int
    DB_USER: str
    DB_PASSWORD: str
    DB_NAME: str

    ENGINE_DB_NAME: str

    REDIS_HOST: str
    REDIS_PORT: int

    SECRET_KEY: str
    OPENAI_API_KEY: str
    MODEL: str
    MODEL_AUDIO: str

    @property
    def database_url(self) -> str:
        password = quote_plus(self.DB_PASSWORD)

        return (
            f"postgresql+asyncpg://{self.DB_USER}:{password}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        )

    @property
    def engine_database_url(self) -> str:
        password = quote_plus(self.DB_PASSWORD)

        return (
            f"postgresql+asyncpg://{self.DB_USER}:{password}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.ENGINE_DB_NAME}"
        )

    @property
    def redis_url(self) -> str:
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}"

    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

settings = Settings()

