from fastapi import APIRouter, HTTPException
from starlette import status
from app.db.repositories.user_repository import UserRepository
from app.db.session import async_session
from app.schemas.user import DeleteRequest

delete_router = APIRouter()
@delete_router.delete("/delete", response_model=None)
async def delete(req: DeleteRequest):
    async with async_session() as session:
        deleted = await UserRepository.delete(session, req.email)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )
        return {"message": "ok - User deleted"}