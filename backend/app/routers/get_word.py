from fastapi import APIRouter, HTTPException
from app.db.session import async_session
from app.schemas.word import WordReadRequest, WordReadResponse, TranslationResponse, TranslationRequest
from app.services.word_service import word_read, word_better_translation, word_synonyms, word_antonyms, word_sentences
from app.logger.logger import backend_logger

read_router = APIRouter()
get_better_translation_router = APIRouter()
get_synonyms_router = APIRouter()
get_antonyms_router = APIRouter()
get_sentences_router = APIRouter()


@read_router.post("/get_word", response_model=WordReadResponse)
async def get_word(req: WordReadRequest):
    backend_logger.info(f"Reading Word attempt: {req}")

    async with async_session() as session:
        result = await word_read(session, req.word, req.user_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Word not found")
    backend_logger.info(f"Reading word success: {result.word}")
    # result — ORM object; WordReadResponse.Config.from_attributes=True позволит валидировать из атрибутов
    return WordReadResponse.model_validate(result)


@get_better_translation_router.post("/get_better_translation", response_model=TranslationResponse)
async def get_better_translation(req: TranslationRequest):
    backend_logger.info(f"Get better word translation attempt: {req}")
    result = await word_better_translation(
        req.word,
        req.source_lang,
        req.target_lang
    )
    if not result:
        raise HTTPException(status_code=401, detail="Translation failed")

    backend_logger.success(f"Translation success: {req.word}")

    return TranslationResponse(
        word=req.word,
        translation_json=result,
    )


@get_synonyms_router.post("/get_synonyms", response_model=WordReadResponse)
async def get_synonyms(req: WordReadRequest):
    backend_logger.info(f"Get synonyms attempt: {req}")

    async with async_session() as session:
        result = await word_synonyms(req.word)  # -> List[str]
    if result is None:
        raise HTTPException(status_code=404, detail="Word not found")
    backend_logger.info(f"Get synonyms success: {req.word}")

    return WordReadResponse(
        word=req.word,
        translation="",
        transcription=None,
        part_of_speech=None,
        synonyms=result,
        antonyms=[],
        examples=[]
    )


@get_antonyms_router.post("/get_antonyms", response_model=WordReadResponse)
async def get_antonyms(req: WordReadRequest):
    backend_logger.info(f"Get antonyms attempt: {req}")

    async with async_session() as session:
        result = await word_antonyms(req.word)  # -> List[str]
    if result is None:
        raise HTTPException(status_code=404, detail="Word not found")
    backend_logger.info(f"Get antonyms success: {req.word}")

    return WordReadResponse(
        word=req.word,
        translation="",
        transcription=None,
        part_of_speech=None,
        synonyms=[],
        antonyms=result,
        examples=[]
    )


@get_sentences_router.post("/get_sentences", response_model=WordReadResponse)
async def get_sentences(req: WordReadRequest):
    backend_logger.info(f"Get sentences attempt: {req}")

    async with async_session() as session:
        result = await word_sentences(req.word)  # -> List[str]
    if result is None:
        raise HTTPException(status_code=404, detail="Word not found")
    backend_logger.info(f"Get sentences success: {req.word}")

    return WordReadResponse(
        word=req.word,
        translation="",
        transcription=None,
        part_of_speech=None,
        synonyms=[],
        antonyms=[],
        examples=result
    )
