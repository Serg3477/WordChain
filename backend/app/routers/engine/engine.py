from fastapi import APIRouter, HTTPException
from app.db.engine_session import engine_async_session
from app.schemas.engine.engine import (
    EngineRequest,
    EngineResponse
)
from app.services.engine.engine import get_engine
from app.logger.logger import backend_logger

engine_router = APIRouter()

@engine_router.post("/engine", response_model=EngineResponse)
async def engine_get(req: EngineRequest):
    backend_logger.info(f"Engine attempt: {req}")

    async with engine_async_session() as session:
        result = await get_engine(session, req)
    backend_logger.info(f"Engine success: {result}")
    return EngineResponse(
        result=result
    )
