from pydantic import BaseModel, Field
from typing import Optional, List



# Базовая схема — общие поля
class SettingBase(BaseModel):
    user_id: int
    input_lang: str
    output_lang: str
    user_level: str
    text_size: int
    examples_count: int
    ui_theme: str
    ui_lang: str
    voice_type: str


# Схема для создания настроек
class NewSettingsRequest(SettingBase):
    user_id: int
    input_lang: Optional[str] = None
    output_lang: Optional[str] = None
    user_level: Optional[str] = None
    text_size: Optional[int] = None
    examples_count: Optional[int] = None
    ui_theme: Optional[str] = None
    ui_lang: Optional[str] = None
    voice_type: Optional[str] = None

class NewSettingsResponse(SettingBase):
    user_id: int
    input_lang: Optional[str] = Field(default="en")
    output_lang: Optional[str] = Field(default="ru")
    user_level: Optional[str] = Field(default="B1")
    text_size: Optional[int] = Field(default=6)
    examples_count: Optional[int] = Field(default=6)
    ui_theme: Optional[str] = Field(default="light")
    ui_lang: Optional[str] = Field(default="en")
    voice_type: Optional[str] = Field(default="shimmer")


# Схема для ответа API
class GetSettingsRequest(BaseModel):
    user_id: int


class GetSettingsResponse(SettingBase):
    user_id: int
    input_lang: Optional[str] = Field(default="en")
    output_lang: Optional[str] = Field(default="ru")
    user_level: Optional[str] = Field(default="B1")
    text_size: Optional[int] = Field(default=6)
    examples_count: Optional[int] = Field(default=6)
    ui_theme: Optional[str] = Field(default="light")
    ui_lang: Optional[str] = Field(default="en")
    voice_type: Optional[str] = Field(default="shimmer")

    class Config:
        from_attributes = True  # позволяет возвращать ORM-модель напрямую



class UpdateSettingsRequest(SettingBase):
    user_id: int
    input_lang: Optional[str] = Field(default="en")
    output_lang: Optional[str] = Field(default="ru")
    user_level: Optional[str] = Field(default="B1")
    text_size: Optional[int] = Field(default=6)
    examples_count: Optional[int] = Field(default=6)
    ui_theme: Optional[str] = Field(default="light")
    ui_lang: Optional[str] = Field(default="en")
    voice_type: Optional[str] = Field(default="shimmer")


class UpdateSettingsResponse(SettingBase):
    user_id: int
    input_lang: Optional[str] = Field(default="en")
    output_lang: Optional[str] = Field(default="ru")
    user_level: Optional[str] = Field(default="B1")
    text_size: Optional[int] = Field(default=6)
    examples_count: Optional[int] = Field(default=6)
    ui_theme: Optional[str] = Field(default="light")
    ui_lang: Optional[str] = Field(default="en")
    voice_type: Optional[str] = Field(default="shimmer")

