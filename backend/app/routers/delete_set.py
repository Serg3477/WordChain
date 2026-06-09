from fastapi import APIRouter, HTTPException
from app.db.session import async_session
from app.schemas.set import SetDeleteRequest, SetDeleteResponse
from app.services.set_service import set_delete
from app.logger.logger import backend_logger

delete_set_router = APIRouter()

@delete_set_router.post("/delete_set", response_model=SetDeleteResponse)
async def delete_set(req: SetDeleteRequest):
    backend_logger.info(f"Delete Set attempt: id={req.set_id}, word={req.name}, user_id={req.user_id}")

    async with async_session() as session:
        result = await set_delete(session, req)
        if result is None:
            raise HTTPException(status_code=404, detail="Word not found")
        return SetDeleteResponse.model_validate(result)
