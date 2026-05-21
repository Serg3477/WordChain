from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

# ---------------------------------------------------------
# 1. DTO для перевода (используется в /translate)
# ---------------------------------------------------------

class TranslationRequest(BaseModel):
    word: str
    source_lang: str
    target_lang: str


class TranslationResponse(BaseModel):
    word: str
    translation: str
    transcription: Optional[str] = None
    part_of_speech: Optional[str] = None

class AnyWordRequest(BaseModel):
    source_lang: str

class AnyWordResponse(BaseModel):
    word: str

# ---------------------------------------------------------
# 2. DTO для создания/обновления слова (используется в /saveWord)
# ---------------------------------------------------------

class WordBase(BaseModel):
    word: str = Field(..., max_length=100)
    translation: str = Field(..., max_length=255)
    part_of_speech: Optional[str] = None
    transcription: Optional[str] = None
    examples: List[str] = []
    synonyms: List[str] = []


class WordCreate(WordBase):
    """То, что приходит от клиента при сохранении слова"""
    pass


class WordUpdate(BaseModel):
    """То, что приходит при обновлении слова"""
    word: Optional[str] = None
    translation: Optional[str] = None
    part_of_speech: Optional[str] = None
    transcription: Optional[str] = None
    examples: Optional[List[str]] = None
    synonyms: Optional[List[str]] = None


# ---------------------------------------------------------
# 3. DTO для ответа API (чтение слова из БД)
# ---------------------------------------------------------

class WordRead(WordBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
