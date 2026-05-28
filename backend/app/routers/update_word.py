from fastapi import APIRouter, HTTPException
from app.db.session import async_session
from app.schemas.word import WordUpdate
from app.services.word_service import word_update
from app.logger.logger import backend_logger

update_router = APIRouter()

@update_router.put("/update_word", response_model=WordUpdate)
async def get_word(req: WordUpdate):
    backend_logger.info(f"Update Word attempt: {req}")
    body = req.model_dump()
    backend_logger.info("Raw update request body: {}", body)

    async with async_session() as session:
        result = await word_update(session, req)
        if result is None:
            raise HTTPException(status_code=404, detail="Word not found")
        # Сериализуем ORM объект в Pydantic пока сессия ещё открыта
        response_obj = WordUpdate.model_validate(result)
    backend_logger.info(f"Reading word success: {result.word}")
    # result — ORM object; WordReadResponse.Config.from_attributes=True позволит валидировать из атрибутов
    return response_obj

