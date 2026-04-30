from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

# -------------------------------------------------------------------
# 1. DTO для регистрации пользователя (используется в /registration)
# -------------------------------------------------------------------

class RegistrationRequest(BaseModel):
    name: str
    email: str
    password: str


class RegistrationResponse(BaseModel):
    nickname: str
    avatar_url: Optional[str] = None
    email: str
    token: str
    is_guest: bool = False
    is_premium: bool = False

class LoginRequest(BaseModel):
    email: str
    password: str
    remember_me: bool = False


class LoginResponse(BaseModel):
    nickname: str
    avatar_url: Optional[str] = None
    email: str
    token: str
    is_guest: bool = False
    is_premium: bool = False


# Базовая схема — общие поля
class UserBase(BaseModel):
    nickname: str = Field(..., max_length=50)
    email: str | None = None
    avatar_url: Optional[str] = None
    is_guest: bool = True
    is_premium: bool = False


# Схема для создания пользователя (регистрация)
class UserCreate(UserBase):
    nickname: str = Field(..., max_length=50)
    avatar_url: Optional[str] = None
    pin: str = Field(..., min_length=4, max_length=20)


# Схема для логина
class UserLogin(BaseModel):
    email: str
    password: str


# Схема для ответа API (чтение)
class UserRead(UserBase):
    id: int
    created_at: datetime
    last_login: Optional[datetime] = None
    is_premium: bool

    class Config:
        from_attributes = True  # позволяет возвращать ORM-модель напрямую


# Схема для обновления профиля
class UserUpdate(BaseModel):
    nickname: Optional[str] = Field(None, max_length=50)
    avatar_url: Optional[str] = None
