from fastapi import APIRouter, HTTPException
from sqlalchemy import update

from app.db.models import Set
from app.db.session import async_session
from app.schemas.set import SetTextRequest, SetTextResponse
from app.services.set_service import get_text_for_set
from app.logger.logger import backend_logger

get_text_router = APIRouter()



@get_text_router.post("/get_text", response_model=SetTextResponse)
async def get_text(req: SetTextRequest):
    backend_logger.info(f"Get text attempt for set: {req.set_id}, user_id: {req.user_id}")

    res = await get_text_for_set(req)
    backend_logger.info(f"Get text success for set: {req.set_id}  user: {req.user_id}")

    if not res:
        backend_logger.error(f"Get text failed for set: {req.set_id}")
        raise HTTPException(status_code=401, detail="Get text from sets words failed")

    async with async_session() as session:
        await session.execute(
            update(Set)
            .where(Set.id == req.set_id, Set.user_id == req.user_id)
            .values(generated_text=res['text'])
        )
        await session.commit()
        backend_logger.info(f"Save text success for set: {req.set_id} user: {req.user_id}")

    return SetTextResponse(text=res['text'], text_translation=res['text_translation'])

