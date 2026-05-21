import asyncio
import json
import re
import unicodedata

from fastapi import HTTPException
from openai import AsyncOpenAI
from redis.asyncio import Redis

from app.db.config import settings
from app.utils.atomic_cache import AtomicCache
from app.utils.word_unrepeat_cache import generate_any_word


client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

redis = Redis.from_url("redis://localhost:6379", decode_responses=True)      # Dev-mode (desktop)
# redis = Redis.from_url("redis://redis:6379", decode_responses=True)        # Docker-mode

MODEL = "gpt-5.4-mini"
TTL_FULL = 60 * 60 * 24 * 30
TTL_PARTS = 60 * 60 * 24 * 30

cache = AtomicCache(redis, default_ttl=TTL_PARTS)


# -----------------------------
# Normalization helpers
# -----------------------------
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


# -----------------------------
# OpenAI wrapper
# -----------------------------
async def _ask_text(prompt: str, max_tokens: int = 60) -> str:
    resp = await client.responses.create(
        model=MODEL,
        input=prompt,
        max_output_tokens=max_tokens,
    )
    return (resp.output_text or "").strip()




# -----------------------------
# Main translation function
# -----------------------------
async def translate_word(word: str, source_lang: str, target_lang: str):
    if not target_lang:
        raise HTTPException(400, "Target language is required")
    if not (word or "").strip():
        raise HTTPException(400, "Word cannot be empty")

    src = _normalize_lang(source_lang, default="auto")
    tgt = _normalize_lang(target_lang, default="ru")
    norm_word = _normalize_word(word)

    # -----------------------------
    # 1. FULL RESULT CACHE
    # -----------------------------
    base_key = f"translate:v2:{src}:{tgt}:{norm_word}"
    full_key = f"{base_key}:full"

    full_cached = await redis.get(full_key)
    if full_cached:
        return json.loads(full_cached)

    # -----------------------------
    # 2. PRODUCERS
    # -----------------------------
    async def produce_correctness():
        prompt = (
            f"Check the spelling of the '{norm_word}' in {src}. "
            f"Return only the corrected word, or '{norm_word}' if already correct. No explanations."
        )
        return await _ask_text(prompt, max_tokens=20)

    async def produce_translation():
        prompt = (
            f"Make several possible translations (max 6, comma-separated) of '{norm_word}' "
            f"from {src} to {tgt}. Return only translations, no explanations."
        )
        return await _ask_text(prompt, max_tokens=50)

    async def produce_transcription():
        prompt = (
            f"Provide IPA transcription for '{norm_word}' in {src}. "
            f"Return only transcription, no slashes, no explanations."
        )
        return await _ask_text(prompt, max_tokens=20)

    async def produce_part_of_speech():
        prompt = (
            f"Determine part of speech and return only short value like noun/verb/adjective/etc  for '{norm_word}' in {src}. "
        )
        return await _ask_text(prompt, max_tokens=20)

    # -----------------------------
    # REDIS. FIRST: CORRECTNESS
    # -----------------------------
    correctness_key = f"{base_key}:v2:correctness"
    correctness = await cache.get_or_set(
        correctness_key,
        produce_correctness,
        ttl=TTL_PARTS
    )

    # If corrected → update norm_word and rebuild keys
    if correctness and correctness != norm_word:
        norm_word = correctness.strip()
        base_key = f"translate:v2:{src}:{tgt}:{norm_word}"

    # -----------------------------
    # REDIS. KEYS FOR OTHER PARTS
    # -----------------------------
    translation_key = f"{base_key}:translation"
    transcription_key = f"{base_key}:transcription"
    pos_key = f"{base_key}:part_of_speech"

    # -----------------------------
    # REDIS. PARALLEL FETCH (ATOMIC)
    # -----------------------------
    translation, transcription, part_of_speech = await asyncio.gather(
        cache.get_or_set(translation_key, produce_translation, TTL_PARTS),
        cache.get_or_set(transcription_key, produce_transcription, TTL_PARTS),
        cache.get_or_set(pos_key, produce_part_of_speech, TTL_PARTS),
    )

    # -----------------------------
    # FINAL RESULT
    # -----------------------------
    result = {
        "word": correctness or "",
        "translation": translation or "",
        "transcription": transcription or "",
        "part_of_speech": part_of_speech or "",
    }
    await redis.set(full_key, json.dumps(result, ensure_ascii=False), ex=TTL_FULL)
    return result


    # -----------------------------
    # Get Any Word function
    # -----------------------------
async def get_any_word(req):
    if not req:
        raise HTTPException(400, "Source language is required")
    return await generate_any_word(
        source_lang=req,
        redis=redis,
        client=client,
        model=MODEL,
        )

