from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# Базовая схема — общие поля
class SettingBase(BaseModel):
    ui_theme: str = "light"
    language: str = "ru"
    difficulty: str = "normal"
    auto_play_audio: bool = False
    show_transcriptions: bool = True
    notifications_enabled: bool = True

# Схема для создания настроек
class SettingCreate(SettingBase):
    pass

# Схема для обновления настроек
class SettingUpdate(BaseModel):
    ui_theme: Optional[str] = Field(None, max_length=20)
    language: Optional[str] = Field(None, max_length=10)
    difficulty: Optional[str] = Field(None, max_length=20)
    auto_play_audio: Optional[bool] = Field(default=False)
    show_transcriptions: Optional[bool] = Field(default=True)
    notifications_enabled: Optional[bool] = Field(default=True)

# Схема для ответа API
class SettingRead(SettingBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True  # позволяет возвращать ORM-модель напрямую