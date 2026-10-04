from fastapi import APIRouter, HTTPException
from sqlalchemy import update, select

from app.db.models import Set
from app.db.session import async_session
from app.schemas.set import SetTextRequest, SetTextResponse, SaveTextRequest, SaveTextResponse
from app.services.set_service import get_text_from_cache, renew_text, text_save
from app.logger.logger import backend_logger
from app.db.models.set import Set

get_text_router = APIRouter()
get_renew_text_router = APIRouter()
save_text_router = APIRouter()

@get_text_router.post("/get_text", response_model=SetTextResponse)
async def get_text(req: SetTextRequest):
    backend_logger.info(f"Get text attempt for set: {req.set_id}, user_id: {req.user_id}")

    # 1. Ищем сохранённый текст в PostgreSQL
    async with async_session() as session:
        result = await session.execute(
            select(Set).where(
                Set.id == req.set_id,
                Set.user_id == req.user_id
            )
        )
        set_row = result.scalar_one_or_none()
    if set_row and set_row.generated_text and set_row.text_translation:
        backend_logger.info(f"Get text success from set savings: {req.set_id}  user: {req.user_id}")
        return SetTextResponse(text=set_row.generated_text or "", text_translation=set_row.text_translation or "")

    # 2. Redis или AI
    cache_text = await get_text_from_cache(req)

    backend_logger.info(
        f"Get text from Redis/AI for set: {req.set_id}"
    )

    return SetTextResponse(
        text=cache_text["text"] or "",
        text_translation=cache_text["text_translation"] or "",
    )

@get_renew_text_router.post("/renew_text", response_model=SetTextResponse)
async def get_renew_text(req: SetTextRequest):
    backend_logger.info(f"Renew text attempt for set: {req.set_id}, user_id: {req.user_id}")
    res = await renew_text(req)
    return SetTextResponse(
        text=res["text"],
        text_translation=res["text_translation"]
    )

@save_text_router.put("/save_text", response_model=SaveTextResponse)
async def save_text(req: SaveTextRequest):
    backend_logger.info(f"Save Text attempt: for user {req.user_id}, for set {req.set_id}")
    async with async_session() as session:
        await text_save(session, req)

    return SaveTextResponse(result="OK")


