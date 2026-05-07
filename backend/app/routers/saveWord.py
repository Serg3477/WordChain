from fastapi import APIRouter, Depends, HTTPException
from app.db.session import async_session
from app.db.repositories.word_repository import WordRepository
from app.schemas.word import TranslationResponse
from app.routers.dependencies import get_current_user
from app.schemas.word import WordBase
from app.logger.logger import backend_logger

save_router = APIRouter()

@save_router.post("/saveWord", response_model=TranslationResponse)
async def save_word(
    result: WordBase,
    user = Depends(get_current_user),

):
    backend_logger.info(f"Saving attempt: {result.word}")
    # сохраняем в БД
    try:
        async with async_session() as session:
            word_obj = await WordRepository.create(
                session=session,
                user_id=user.id,
                word=result.word,
                translation=result.translation,
                part_of_speech=result.part_of_speech,
                transcription=None,
                examples=result.examples,
                synonyms=[]
            )
    except Exception as e:
        backend_logger.exception(f"Unhandled error: {e}")
        raise

    backend_logger.info(f"Word saved success: {word_obj.word}")
    return word_obj
