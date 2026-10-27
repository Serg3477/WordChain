from openai import OpenAI
import base64
import asyncio
from typing import Literal

from app.db.config import settings
from logger.logger import backend_logger

VoiceType = Literal["alloy", "echo", "fable", "onyx", "nova", "shimmer"]

# -----------------------------
# OpenAI wrapper
# -----------------------------

client = OpenAI(api_key=settings.OPENAI_API_KEY)

async def _ask_text(prompt: str, max_tokens: int = 400, reasoning_effort: str | None = None) -> str:
    response = client.chat.completions.create(
        model=settings.MODEL,
        messages=[{"role": "user", "content": prompt}],
        max_completion_tokens=max_tokens,
        reasoning_effort = reasoning_effort
    )

    choice = response.choices[0]
    content = choice.message.content
    backend_logger.info(f"AI finish_reason: {choice.finish_reason}")
    backend_logger.info(f"AI usage: {response.usage}")
    backend_logger.info(f"AI content length: {len(content or '')}")

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


