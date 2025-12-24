from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# Базовая схема — общие поля
class WordBase(BaseModel):
    word: str = Field(..., max_length=100)
    translation: str = Field(..., max_length=255)
    part_of_speech: Optional[str] = None

    examples: Optional[List[str]] = []
    synonyms: Optional[List[str]] = []


# Схема для создания слова
class WordCreate(WordBase):
    pass


# Схема для обновления слова
class WordUpdate(BaseModel):
    word: Optional[str] = Field(None, max_length=100)
    translation: Optional[str] = Field(None, max_length=255)
    part_of_speech: Optional[str] = None

    examples: Optional[List[str]] = None
    synonyms: Optional[List[str]] = None


# Схема для ответа API
class WordRead(WordBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True  # позволяет возвращать ORM-модель напрямую
