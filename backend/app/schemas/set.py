from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

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