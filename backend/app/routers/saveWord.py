from fastapi import APIRouter, Depends
from app.db.session import async_session
from app.db.repositories.word_repository import WordRepository
from app.schemas.word import TranslationResponse
from app.routers.dependencies import get_current_user
from app.schemas.word import WordBase

save_router = APIRouter()

@save_router.post("/saveWord", response_model=TranslationResponse)
async def save_word(
    result: WordBase,
    user = Depends(get_current_user),

):

    # сохраняем в БД
    async with async_session() as session:
        word_obj = await WordRepository.create(
            session=session,
            user_id=user.id,
            word=result.word,
            translation=result.translation,
            part_of_speech=result.part_of_speech,
            transcription=None,
            examples=result.examples,
            synonyms=[]
        )

    return word_obj
