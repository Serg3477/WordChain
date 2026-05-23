from fastapi import APIRouter, Depends, HTTPException
from app.db.session import async_session
from app.db.repositories.word_repository import WordRepository
from app.schemas.word import TranslationResponse, WordCreate
from app.routers.dependencies import get_current_user
from app.logger.logger import backend_logger
from app.services.set_service import check_and_create_set

save_router = APIRouter()

@save_router.post("/saveWord", response_model=TranslationResponse)
async def save_word(
    result: WordCreate,
    user = Depends(get_current_user),
):
    backend_logger.info(f"Saving attempt: {result.word}")
    try:
        async with async_session() as session:
            examples = getattr(result, "examples", None) or []
            synonyms = getattr(result, "synonyms", None) or []
            antonyms = getattr(result, "antonyms", None) or []

            word_obj = await WordRepository.create(
                session=session,
                user_id=user.id,
                word=result.word,
                translation=result.translation,
                part_of_speech=result.part_of_speech,
                transcription=result.transcription,
                examples=examples,
                synonyms=synonyms,
                antonyms=antonyms
            )
    except Exception as e:
        backend_logger.exception(f"Unhandled error: {e}")
        raise

    backend_logger.info(f"Word saved success: {word_obj.word}")
    await check_and_create_set(user.id)

    # Возвращаем только поля, которые ожидает TranslationResponse
    return TranslationResponse(
        word=word_obj.word,
        translation=word_obj.translation,
        transcription=word_obj.transcription,
        part_of_speech=word_obj.part_of_speech
    )
