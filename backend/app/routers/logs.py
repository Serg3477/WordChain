from fastapi import APIRouter
from app.schemas.logs import FrontendLogs
from app.logger.logger import frontend_logger


logs_router = APIRouter()

@logs_router.post("/frontend-log")
async def receive_frontend_logs(log: FrontendLogs):
    frontend_logger.info(
        f"[{log.level}] {log.message} {log.data}"
    )
    return {"status": "ok"}
