from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

from sqlalchemy.dialects.mssql import JSON


# ---------------------------------------------------------
# 1. DTO запроса сетов (используется в /get_sets)
# ---------------------------------------------------------

class SetsRequest(BaseModel):
    name: str


class SetItem(BaseModel):
    id: int
    name: str
    word_ids: list[int]

class WordItem(BaseModel):
    id: int
    word: str

class SetsResponse(BaseModel):
    sets: List[SetItem] = Field(default_factory=list)
    unassigned_words: List[WordItem] = Field(default_factory=list)


# ---------------------------------------------------------
# 1. DTO запроса сетов (используется в /get_sets)
# ---------------------------------------------------------

class WordsFromSetRequest(BaseModel):
    word_ids: list[int]

class WordsItem(BaseModel):
    id: int
    word: str

class WordsFromSetResponse(BaseModel):
    word_list: list[WordsItem]




# Базовая схема — общие поля
class SetBase(BaseModel):
    name: str = Field(..., max_length=50)
    description: Optional[str] = None

    word_ids: List[int] = Field(default_factory=list)
    generated_text: Optional[str] = None

# Схема для создания набора
class SetCreate(SetBase):
    pass


# Схема для обновления набора
class SetUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=50)
    description: Optional[str] = None

    word_ids: Optional[List[int]] = None
    generated_text: Optional[str] = None

# Схема для ответа API
class SetRead(SetBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True  # позволяет возвращать ORM-модель напрямую


# ---------------------------------------------------------
# 1. DTO удаления сета (используется в /delete_set)
# ---------------------------------------------------------
class SetDeleteRequest(BaseModel):
    set_id: int
    name: str
    user_id: int
    # опционально, только для сверки с БД:
    word_ids: list[int] | None = None

class SetDeleteResponse(BaseModel):
    set_id: int
    name: str
    deleted_word_ids: List[int] = Field(default_factory=list)
    deleted_words_count: int = 0
