from openai import OpenAI
import base64
import asyncio
from typing import Literal

from app.db.config import settings


VoiceType = Literal["alloy", "echo", "fable", "onyx", "nova", "shimmer"]

# -----------------------------
# OpenAI wrapper
# -----------------------------

client = OpenAI(api_key=settings.OPENAI_API_KEY)

async def _ask_text(prompt: str, max_tokens: int = 60) -> str:
    response = client.chat.completions.create(
        model=settings.MODEL,
        messages=[{"role": "user", "content": prompt}],
        max_completion_tokens=max_tokens,
    )

    return response.choices[0].message.content.strip()


async def _ask_voice(prompt: str, voice_type: VoiceType):
    response = client.audio.speech.create(
        model=settings.MODEL_AUDIO,
        input=prompt,
        # "alloy", "echo", "fable", "onyx", "nova", "shimmer"
        voice=voice_type,
        response_format="mp3"
    )
    audio_bytes = await asyncio.to_thread(response.read)
    audio_base64 = base64.b64encode(audio_bytes).decode("utf-8")

    return audio_base64


