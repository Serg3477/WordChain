import asyncio
import json
import re
import unicodedata

from fastapi import HTTPException
from openai import AsyncOpenAI
from redis.asyncio import Redis

from app.db.config import settings

client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

redis = Redis.from_url("redis://localhost:6379", decode_responses=True)      # Dev-mode (desktop)
# redis = Redis.from_url("redis://redis:6379", decode_responses=True)        # Docker-mode


MODEL = "gpt-4o-mini"
TTL_FULL = 60 * 60 * 24 * 30
TTL_PARTS = 60 * 60 * 24 * 30


def _normalize_word(word: str) -> str:
    value = unicodedata.normalize("NFKC", word or "")
    value = value.strip().lower()
    value = re.sub(r"\s+", " ", value)
    value = value.rstrip("!?.,;:")
    return value


def _normalize_lang(lang: str, default: str = "auto") -> str:
    aliases = {
        "eng": "en",
        "english": "en",
        "ru-ru": "ru",
        "рус": "ru",
    }
    value = (lang or "").strip().lower()
    if not value:
        return default
    return aliases.get(value, value)


async def _ask_text(prompt: str, max_tokens: int = 60) -> str:
    resp = await client.responses.create(
        model=MODEL,
        input=prompt,
        max_output_tokens=max_tokens,
    )
    return (resp.output_text or "").strip()


async def _get_or_set(key: str, producer, ttl: int):
    cached = await redis.get(key)
    if cached is not None:
        return json.loads(cached)
    value = await producer()
    await redis.set(key, json.dumps(value, ensure_ascii=False), ex=ttl)
    return value


async def translate_word(word: str, source_lang: str, target_lang: str):
    if not target_lang:
        raise HTTPException(400, "Target language is required")
    if not (word or "").strip():
        raise HTTPException(400, "Word cannot be empty")

    src = _normalize_lang(source_lang, default="auto")
    tgt = _normalize_lang(target_lang, default="ru")
    norm_word = _normalize_word(word)

    base_key = f"translate:v2:{src}:{tgt}:{norm_word}"
    full_key = f"{base_key}:full"

    full_cached = await redis.get(full_key)
    if full_cached:
        return json.loads(full_cached)

    translation_key = f"{base_key}:translation"
    transcription_key = f"{base_key}:transcription"
    pos_key = f"{base_key}:part_of_speech"


    async def produce_translation():
        prompt = (
            f"Make several possible translations (no more 6 translations, separated by comas) of word for all parts of speech '{norm_word}' from {src} to {tgt}. "
            f"Return only translated word or short phrase, no explanations."
        )
        text = await _ask_text(prompt, max_tokens=50)
        return text

    async def produce_transcription():
        prompt = (
            f"Provide IPA transcription for the word '{norm_word}' in {src}. "
            f"Return only transcription string, no explanations, no slashes."
        )
        return await _ask_text(prompt, max_tokens=20)

    async def produce_part_of_speech():
        prompt = (
            f"Determine part of speech (or several parts of speech separated by ' / ') for word '{norm_word}' in {src}. "
            f"Return only one short value like noun/verb/adjective."
        )
        text = await _ask_text(prompt, max_tokens=20)
        return text



    translation, transcription, part_of_speech = await asyncio.gather(
        _get_or_set(translation_key, produce_translation, TTL_PARTS),
        _get_or_set(transcription_key, produce_transcription, TTL_PARTS),
        _get_or_set(pos_key, produce_part_of_speech, TTL_PARTS),
    )

    result = {
        "translation": translation or "",
        "transcription": transcription or "",
        "part_of_speech": part_of_speech or "",
    }

    await redis.set(full_key, json.dumps(result, ensure_ascii=False), ex=TTL_FULL)
    return result