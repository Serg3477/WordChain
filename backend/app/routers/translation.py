from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.schemas.translation import TranslationRequest, TranslationResponse
from app.routers.dependencies import get_current_user
from app.services.translation_service import translate_word
from app.db.session import async_session
from app.db.repositories.word_repository import WordRepository

router = APIRouter()

@router.post("/translate", response_model=TranslationResponse)
async def translate(
    req: TranslationRequest,
    user = Depends(get_current_user)
):
    translation_json = await translate_word(
        req.word,
        req.source_lang,
        req.target_lang
    )

    # сохраняем в БД
    async with async_session() as session:
        word_obj = await WordRepository.create(
            session=session,
            user_id=user.id,
            word=req.word,
            translation=translation_json
        )

    return TranslationResponse(translation=translation_json)
