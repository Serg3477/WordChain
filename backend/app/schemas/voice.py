from pydantic import BaseModel, Field


# ---------------------------------------------------------
# 1. DTO для голосового выражения слова (используется в /get_voice)
# ---------------------------------------------------------
class VoiceRequest(BaseModel):
    word: str
    source_lang: str
    voice_type: str
    context: str

class VoiceResponse(BaseModel):
    audio_data: str
