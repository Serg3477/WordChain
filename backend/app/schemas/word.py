from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# -----------------------------
# 0. Базовые типы и общие поля
# -----------------------------
class WordBase(BaseModel):
    word: str = Field(..., max_length=100)
    translation: str = Field(..., max_length=255)
    part_of_speech: Optional[str] = Field(None, max_length=50)
    transcription: Optional[str] = Field(None, max_length=50)


# -----------------------------
# 1. DTO для создания / обновления (входящие запросы)
# -----------------------------
class WordCreate(WordBase):
    examples: Optional[List[str]] = None
    synonyms: Optional[List[str]] = None
    antonyms: Optional[List[str]] = None


class WordUpdate(BaseModel):
    word: Optional[str] = None
    translation: Optional[str] = None
    part_of_speech: Optional[str] = None
    transcription: Optional[str] = None
    examples: Optional[List[str]] = None
    synonyms: Optional[List[str]] = None
    antonyms: Optional[List[str]] = None


# -----------------------------
# 2. DTO для переводов (translate endpoints)
# -----------------------------
class TranslationRequest(BaseModel):
    word: str
    source_lang: str
    target_lang: str


class TranslationResponse(BaseModel):
    word: str
    translation: str
    transcription: Optional[str] = None
    part_of_speech: Optional[str] = None


# -----------------------------
# 3. DTO для чтения / ответов API
# -----------------------------
class WordReadRequest(BaseModel):
    user_id: int
    word: str


class WordReadResponse(BaseModel):
    word: str
    translation: Optional[str] = None
    part_of_speech: Optional[str] = None
    transcription: Optional[str] = None
    examples: Optional[List[str]] = None
    synonyms: Optional[List[str]] = None
    antonyms: Optional[List[str]] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# -----------------------------
# 4. Небольшие вспомогательные DTO
# -----------------------------
class AnyWordRequest(BaseModel):
    source_lang: str


class AnyWordResponse(BaseModel):
    word: str
