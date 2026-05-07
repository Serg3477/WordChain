from fastapi import APIRouter, HTTPException
from app.schemas.word import TranslationRequest, TranslationResponse
from app.services.translation_service import translate_word
from app.logger.logger import backend_logger

translation_router = APIRouter()

@translation_router.post("/translate", response_model=TranslationResponse)
async def translate( req: TranslationRequest):
    backend_logger.info(f"Translation attempt: {req.word}")
    translation_json = await translate_word(
        req.word,
        req.source_lang,
        req.target_lang
    )
    if not translation_json:
        raise HTTPException(status_code=401, detail="Translation failed")

    backend_logger.success(f"Translation success: {req.word}")
    return TranslationResponse(**translation_json)
