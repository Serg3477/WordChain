from fastapi import APIRouter, HTTPException
from app.db.session import async_session
from app.db.repositories.word_repository import WordRepository
from app.schemas.word import WordMoveRequest, WordMoveResponse
from app.services.word_service import word_move
from app.logger.logger import backend_logger

move_word_router = APIRouter()

@move_word_router.post("/move_word", response_model=WordMoveResponse)
async def move_word(req: WordMoveRequest):
    backend_logger.info(f"Move Word attempt: id={req.id}, word={req.word}, user_id={req.user_id} from set={req.old_set} to set={req.new_set}")

    async with async_session() as session:
        result = await word_move(session, req)
        if result is None:
            raise HTTPException(status_code=404, detail="Word not found")

        return WordMoveResponse.model_validate(result)
