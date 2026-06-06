from fastapi import APIRouter, HTTPException
from app.db.session import async_session
from app.schemas.word import WordDeleteRequest, WordDeleteResponse
from app.services.word_service import word_delete
from app.logger.logger import backend_logger

delete_word_router = APIRouter()

@delete_word_router.post("/delete_word", response_model=WordDeleteResponse)
async def delete_word(req: WordDeleteRequest):
    backend_logger.info(f"Delete Word attempt: id={req.id}, word={req.word}, user_id={req.user_id}")

    async with async_session() as session:
        result = await word_delete(session, req)
        if result is None:
            raise HTTPException(status_code=404, detail="Word not found")
        return WordDeleteResponse.model_validate(result)
