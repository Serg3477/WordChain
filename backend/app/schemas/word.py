from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# -----------------------------
# 0. Базовые типы и общие поля
# -----------------------------
class TranslationJSON(BaseModel):
    definite_translation: List[str] = Field(default_factory=list)
    plural: Optional[str] = None
    verb_forms: List[str] = Field(default_factory=list)
    passive_form: Optional[str] = None
    phrasal_verbs: List[str] = Field(default_factory=list)
    usage_notes: Optional[str] = None


class WordBase(BaseModel):
    word: str = Field(..., max_length=100)
    translation: str = Field(..., max_length=255)
    translation_json: Optional[TranslationJSON] = Field(default_factory=TranslationJSON)
    part_of_speech: Optional[str] = Field(None, max_length=50)
    transcription: Optional[str] = Field(None, max_length=50)


# -----------------------------
# 1. DTO для создания / обновления (входящие запросы)
# -----------------------------
class WordCreate(WordBase):
    examples: Optional[List[str]] = None
    synonyms: Optional[List[str]] = None
    antonyms: Optional[List[str]] = None


class WordUpdateByIdRequest(BaseModel):
    id: int
    user_id: int
    translation: Optional[str] = None
    translation_json: Optional[TranslationJSON] = None
    part_of_speech: Optional[str] = None
    transcription: Optional[str] = None
    examples: Optional[List[str]] = None
    synonyms: Optional[List[str]] = None
    antonyms: Optional[List[str]] = None

    class Config:
        from_attributes = True


# -----------------------------
# 2. DTO для переводов (translate endpoints)
# -----------------------------
class TranslationRequest(BaseModel):
    word: str
    source_lang: str
    target_lang: str


class TranslationResponse(BaseModel):
    word: str
    translation: str = None
    transcription: Optional[str] = None
    part_of_speech: Optional[str] = None


# -----------------------------
# 3. DTO для запросов синонимов, антонимов, предложений, расширенного перевода к слову / ответов API
# -----------------------------
class WordByIdRequest(BaseModel):
    id: int
    user_id: int
    examples_count:  Optional[int] = None


class BetterTranslationByIdRequest(WordByIdRequest):
    source_lang: str
    target_lang: str



class WordReadResponse(BaseModel):
    id: int
    word: str
    translation: Optional[str] = None
    translation_json: Optional[TranslationJSON] = None
    part_of_speech: Optional[str] = None
    transcription: Optional[str] = None
    examples: List[str] = Field(default_factory=list)
    synonyms: List[str] = Field(default_factory=list)
    antonyms: List[str] = Field(default_factory=list)
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


# -----------------------------
# 5. DTO для удаления слов
# -----------------------------
class WordDeleteRequest(BaseModel):
    id: int
    user_id: int
    word: str


class WordDeleteResponse(BaseModel):
    id: int
    word: str
    translation: Optional[str] = None
    translation_json: Optional[TranslationJSON] = None
    part_of_speech: Optional[str] = None
    transcription: Optional[str] = None
    examples: List[str] = Field(default_factory=list)
    synonyms: List[str] = Field(default_factory=list)
    antonyms: List[str] = Field(default_factory=list)
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# -----------------------------
# 5. DTO для перемещения слов
# -----------------------------
class WordMoveRequest(BaseModel):
    id: int
    user_id: int
    word: str
    old_set: Optional[int] = None
    new_set: Optional[int] = None


class WordMoveResponse(BaseModel):
    id: int
    word: str
    translation: Optional[str] = None
    translation_json: Optional[TranslationJSON] = None
    part_of_speech: Optional[str] = None
    transcription: Optional[str] = None
    examples: Optional[List[str]] = Field(default_factory=list)
    synonyms: Optional[List[str]] = Field(default_factory=list)
    antonyms: Optional[List[str]] = Field(default_factory=list)
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None