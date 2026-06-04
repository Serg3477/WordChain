from fastapi import APIRouter, HTTPException
from app.schemas.word import AnyWordRequest, AnyWordResponse
from app.services.word_service import get_any_word
from app.logger.logger import backend_logger

anyword_router = APIRouter()

@anyword_router.post("/any_word", response_model=AnyWordResponse)
async def translate( req: AnyWordRequest):
    backend_logger.info(f"Get Any Word attempt: {req.source_lang}")
    any_word_json = await get_any_word(
        req.source_lang,
    )
    if not any_word_json:
        raise HTTPException(status_code=401, detail="Translation failed")

    backend_logger.success(f"Get Any Word success: {req.source_lang}")
    return AnyWordResponse(**any_word_json)
