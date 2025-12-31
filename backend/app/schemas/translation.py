from pydantic import BaseModel

class TranslationRequest(BaseModel):
    word: str
    source_lang: str
    target_lang: str


class TranslationResponse(BaseModel):
    translation: str
