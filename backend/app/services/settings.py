from sqlalchemy import select
from fastapi import HTTPException, status
from app.db.models.settings import Settings
from app.schemas.settings import UpdateSettingsRequest
from app.logger.logger import backend_logger


async def get_settings_by_user_id(session, user_id: str) -> Settings:
    result = await session.execute(select(Settings).where(Settings.user_id == user_id))
    existing_settings = result.scalar_one_or_none()
    backend_logger.info(f"Settings found for user: {user_id} -  {existing_settings}")
    if not existing_settings:
        backend_logger.error(f"Settings not found for user: {user_id}")
    return existing_settings


async def update_settings_by_user_id(session, req: UpdateSettingsRequest) -> Settings:
    w = None
    stmt = select(Settings).where(
        Settings.user_id == req.user_id
    )
    backend_logger.info(f"settings_update stmt: {stmt}")

    res = await session.execute(stmt)
    w = res.scalar_one_or_none()
    if not w:
        raise HTTPException(404, "Not found")

    # merge simple fields
    if getattr(req, "input_lang", None) is not None:
        w.input_lang = req.input_lang
    if getattr(req, "output_lang", None) is not None:
        w.output_lang = req.output_lang
    if getattr(req, "user_level", None) is not None:
        w.user_level = req.user_level
    if getattr(req, "text_size", None) is not None:
        w.text_size = req.text_size
    if getattr(req, "examples_count", None) is not None:
        w.examples_count = req.examples_count
    if getattr(req, "ui_theme", None) is not None:
        w.ui_theme = req.ui_theme
    if getattr(req, "ui_lang", None) is not None:
        w.ui_lang = req.ui_lang
    if getattr(req, "voice_type", None) is not None:
        w.voice_type = req.voice_type

    await session.commit()
    await session.refresh(w)
    return w