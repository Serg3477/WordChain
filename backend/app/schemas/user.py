from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


# Базовая схема — общие поля
class UserBase(BaseModel):
    nickname: str = Field(..., max_length=50)
    avatar_url: Optional[str] = None


# Схема для создания пользователя (регистрация)
class UserCreate(UserBase):
    nickname: str = Field(..., max_length=50)
    avatar_url: Optional[str] = None
    pin: str = Field(..., min_length=4, max_length=20)


# Схема для логина
class UserLogin(BaseModel):
    nickname: str
    pin: str


# Схема для ответа API (чтение)
class UserRead(UserBase):
    id: int
    created_at: datetime
    last_login: Optional[datetime] = None
    is_active: bool
    is_premium: bool

    class Config:
        from_attributes = True  # позволяет возвращать ORM-модель напрямую


# Схема для обновления профиля
class UserUpdate(BaseModel):
    nickname: Optional[str] = Field(None, max_length=50)
    avatar_url: Optional[str] = None
