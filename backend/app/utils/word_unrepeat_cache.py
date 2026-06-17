# This module provides utilities for generating a random English word
# while ensuring that it does not repeat recently generated words.
# It uses Redis to store the history of generated words and OpenAI's API to generate
# new words based on a specified prompt.
import re
from fastapi import HTTPException
from redis.asyncio import Redis
from openai import AsyncOpenAI
from app.db.config import settings
from app.utils.openai import _ask_text


DEFAULT_CLIENT = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
DEFAULT_REDIS = Redis.from_url("redis://localhost:6379", decode_responses=True)


ANY_WORD_HISTORY_KEY = "any_word:history"
ANY_WORD_HISTORY_SIZE = 30
ALLOWED_WORD_RE = re.compile(r"^[a-z]+(?:-[a-z]+)?$")


def _is_valid_candidate(word: str) -> bool:
    return bool(word) and bool(ALLOWED_WORD_RE.match(word))


async def _get_recent_words(redis: Redis, limit: int = ANY_WORD_HISTORY_SIZE) -> list[str]:
    items = await redis.lrange(ANY_WORD_HISTORY_KEY, 0, max(0, limit - 1))
    return [w.strip().lower() for w in items if isinstance(w, str) and w.strip()]


async def _push_word(redis: Redis, word: str) -> None:
    await redis.lpush(ANY_WORD_HISTORY_KEY, word)
    await redis.ltrim(ANY_WORD_HISTORY_KEY, 0, ANY_WORD_HISTORY_SIZE - 1)


async def generate_any_word(
    *,
    source_lang: str,
    redis: Redis | None = None,
    retries: int = 3,
) -> dict:
    # подставляем дефолты, если не переданы
    redis = redis or DEFAULT_REDIS


    if not source_lang:
            raise HTTPException(400, "Source language is required")

    recent_words = await _get_recent_words(redis)
    banned = ", ".join(recent_words) if recent_words else "none"

    prompt = f"""
        Pick exactly one random everyday English word for language learners.
        Use a content word only: noun, verb, adjective, or adverb.
        Use A1-B2 level vocabulary.
        Avoid technical, scientific, medical, legal, business, programming, and slang words.
        Do not use any word from this banned list: {banned}.
        If your first choice is banned, pick a different one.
        Return only one lowercase word, no punctuation, no extra text.
    """.strip()

    for _ in range(retries):
        raw = await _ask_text(prompt, max_tokens=20)
        candidate = re.sub(r"[^a-z-]", "", (raw or "").strip().lower())

        if not _is_valid_candidate(candidate):
            continue
        if candidate in recent_words:
            continue

        await _push_word(redis, candidate)
        return {"word": candidate}

    raise HTTPException(502, "Failed to generate a non-repeating word")

