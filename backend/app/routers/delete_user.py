from fastapi import APIRouter, HTTPException
from starlette import status
from app.db.repositories.user_repository import UserRepository
from app.db.session import async_session
from app.schemas.user import DeleteRequest
from app.logger.logger import backend_logger

delete_router = APIRouter()

@delete_router.delete("/delete", response_model=None)
async def delete(req: DeleteRequest):
    backend_logger.info(f"Delete user attempt: {req.email}")
    async with async_session() as session:
        deleted = await UserRepository.delete(session, req.email)
        if not deleted:
            backend_logger.warning(f"Delete user failed for email={req.email}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not deleted",
            )
        backend_logger.success(f"User deleted: {req.email}")
        return {"message": "ok - User deleted"}
