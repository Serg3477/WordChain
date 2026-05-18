from fastapi import APIRouter
from app.db.session import async_session
from app.schemas.set import WordsFromSetRequest, WordsFromSetResponse
from app.services.set_service import get_words_from_set
from app.logger.logger import backend_logger

words_from_set_router = APIRouter()

@words_from_set_router.post("/get_words", response_model=WordsFromSetResponse)
async def get_words(req: WordsFromSetRequest):
    backend_logger.info(f"Getting Sets attempt: {req}")

    async with async_session() as session:
        words_from_set_list = await get_words_from_set(session, req.word_ids)

    backend_logger.info(f"Getting Sets success: {words_from_set_list}")
    return WordsFromSetResponse(word_list=words_from_set_list)
