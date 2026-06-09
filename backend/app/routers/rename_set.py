from fastapi import APIRouter, HTTPException
from app.db.session import async_session
from app.schemas.set import SetRenameRequest, SetRenameResponse
from app.services.set_service import set_rename
from app.logger.logger import backend_logger

rename_set_router = APIRouter()

@rename_set_router.patch("/rename_set", response_model=SetRenameResponse)
async def delete_word(req: SetRenameRequest):
    backend_logger.info(f"Delete Word attempt: id={req.set_id}, word={req.name}, user_id={req.user_id}")

    async with async_session() as session:
        result = await set_rename(session, req)
        if result is None:
            raise HTTPException(status_code=404, detail="Word not found")
        return SetRenameResponse.model_validate(result)
