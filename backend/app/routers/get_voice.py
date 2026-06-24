from fastapi import APIRouter, HTTPException
from app.schemas.voice import VoiceRequest, VoiceResponse
from app.services.audio_service import get_voice_for_word
from app.logger.logger import backend_logger

get_voice_router = APIRouter()

@get_voice_router.post("/get_voice", response_model=VoiceResponse)
async def get_voice(req: VoiceRequest):
    backend_logger.info(f"Get voice attempt for word: {req.word}")

    res = await get_voice_for_word(req)
    backend_logger.info(f"Get voice success for word: {req.word}")

    if not res:
        backend_logger.error(f"Get voice failed for word: {req.word}")
        raise HTTPException(status_code=401, detail=f"Get voice for word {req.word} failed")

    return VoiceResponse(audio_data=res["audio_data"])