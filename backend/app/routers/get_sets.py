from fastapi import APIRouter, HTTPException
from app.db.session import async_session
from app.schemas.set import SetsRequest, SetsResponse
from app.services.set_service import get_user_sets
from app.logger.logger import backend_logger

sets_router = APIRouter()

@sets_router.post("/get_sets", response_model=SetsResponse)
async def get_sets(req: SetsRequest):
    backend_logger.info(f"Getting Sets attempt: {req}")

    async with async_session() as session:
        data = await get_user_sets(session, req.name)

    backend_logger.info(f"Getting Sets success: {data['sets']} /n  Unassigned_words {data['unassigned_words']}")
    return SetsResponse(
        sets=data["sets"],
        unassigned_words=data["unassigned_words"]
    )
