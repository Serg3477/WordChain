from fastapi import APIRouter, HTTPException
from app.db.session import async_session
from app.schemas.settings import NewSettingsResponse, NewSettingsRequest
from app.schemas.settings import GetSettingsResponse, GetSettingsRequest
from app.schemas.settings import UpdateSettingsResponse, UpdateSettingsRequest
from app.db.repositories.settings_repository import SettingsRepository
from app.logger.logger import backend_logger
from app.services.settings import get_settings_by_user_id, update_settings_by_user_id

new_settings_router = APIRouter()
get_settings_router = APIRouter()
update_settings_router = APIRouter()


@new_settings_router.post("/new_settings", response_model=NewSettingsResponse)
async def new_settings(req: NewSettingsRequest):
    backend_logger.info(f"Create new settings for new user attempt: {req.user_id}")
    async with async_session() as session:
        try:
            settings = await SettingsRepository.create(session, req)

        except Exception as e:
            backend_logger.exception(f"Unhandled error: {e}")
            raise
    backend_logger.info(f"Set new settings for new user success:  {req.user_id}")
    return NewSettingsResponse(
        user_id=settings.user_id,
        input_lang=settings.input_lang,
        output_lang=settings.output_lang,
        user_level=settings.user_level,
        text_size=settings.text_size,
        examples_count=settings.examples_count,
        ui_theme=settings.ui_theme,
        ui_lang=settings.ui_lang,
        voice_type=settings.voice_type
    )


@get_settings_router.post("/get_settings", response_model=GetSettingsResponse)
async def get_settings(req: GetSettingsRequest):
    backend_logger.info(f"Get settings for user attempt: {req.user_id}")
    settings = await get_settings_by_user_id(async_session(), req.user_id)
    if not settings:
        backend_logger.error(f"Settings not found for user: {req.user_id}")
        raise HTTPException(status_code=404, detail="Settings not found")
    backend_logger.info(f"Get settings for user success: {settings.id}")
    return GetSettingsResponse(
        user_id=settings.user_id,
        input_lang=settings.input_lang,
        output_lang=settings.output_lang,
        user_level=settings.user_level,
        text_size=settings.text_size,
        examples_count=settings.examples_count,
        ui_theme=settings.ui_theme,
        ui_lang=settings.ui_lang,
        voice_type=settings.voice_type
    )

@update_settings_router.put("/update_settings", response_model=UpdateSettingsResponse)
async def update_settings(req: UpdateSettingsRequest):
    backend_logger.info(f"Update settings for user attempt: {req.user_id}")
    async with async_session() as session:
        settings = await update_settings_by_user_id(session, req)
        if settings is None:
            raise HTTPException(status_code=404, detail=f"Settings for user {req.user_id} not found")
        return UpdateSettingsResponse(
            user_id=settings.user_id,
            input_lang=settings.input_lang,
            output_lang=settings.output_lang,
            user_level=settings.user_level,
            text_size=settings.text_size,
            examples_count=settings.examples_count,
            ui_theme=settings.ui_theme,
            ui_lang=settings.ui_lang,
            voice_type=settings.voice_type
        )

