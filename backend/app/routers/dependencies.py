from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer
from jose import jwt, JWTError
from app.db.session import async_session
from app.db.models.user import User
from app.services.jwt_service import ALGORITHM
from app.db.config import settings

auth_scheme = HTTPBearer()

# Зависимость для получения текущего пользователя
async def get_current_user(token: str = Depends(auth_scheme)):
    try:
        payload = jwt.decode(token.credentials, settings.SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    async with async_session() as session:
        user = await session.get(User, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user
