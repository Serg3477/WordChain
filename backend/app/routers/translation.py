from fastapi import APIRouter
from app.schemas.word import TranslationRequest, TranslationResponse
from app.services.translation_service import translate_word


translation_router = APIRouter()

@translation_router.post("/translate", response_model=TranslationResponse)
async def translate( req: TranslationRequest):
    translation_json = await translate_word(
        req.word,
        req.source_lang,
        req.target_lang
    )

    return TranslationResponse(**translation_json)
