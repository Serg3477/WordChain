# --- Общая утилита кеширования JSON-значений в Redis ---
from typing import Iterable, List
from redis.asyncio import Redis
from app.utils.atomic_cache import AtomicCache
from app.logger.logger import backend_logger
from app.db import settings
import uuid
import json

TTL_FULL = 60 * 60 * 24 * 30
TTL_PARTS = 60 * 60 * 24 * 30


redis = Redis.from_url(f"redis://{settings.REDIS_HOST}:{settings.REDIS_PORT}", decode_responses=True)      # Dev-mode
# redis = Redis.from_url("redis://redis:6379", decode_responses=True)        # Docker-mode

cache = AtomicCache(redis, default_ttl=TTL_PARTS)


# -----------------------------
# Unified key-builder
# -----------------------------
def k(*parts: str) -> str:
    """Builds Redis keys in a consistent, safe format."""
    return ":".join(str(p) for p in parts if p is not None)


# -----------------------------
# Delete keys safely
# -----------------------------
async def delete_keys(*keys: str) -> None:
    if not keys:
        return
    try:
        await redis.delete(*[k for k in keys if k])
    except Exception:
        backend_logger.exception("Failed to delete cache keys: %s", keys)


# -----------------------------
# Collect all translation-related keys
# -----------------------------
def collect_translation_keys(
    word: str,
    srcs: Iterable[str] = ("auto",),
    tgts: Iterable[str] = ("ru",),
) -> List[str]:
    norm = (word or "").strip().lower()
    keys: List[str] = []

    for src in srcs:
        for tgt in tgts:
            keys.extend([
                k("translate", "v2", src, tgt, norm, "correctness"),
                k("translate", "v2", src, tgt, norm, "translation"),
                k("translate", "v2", src, tgt, norm, "transcription"),
                k("translate", "v2", src, tgt, norm, "part_of_speech"),
                k("translate", "v2", src, tgt, norm, "better_translation"),
            ])

    keys.extend([
        k("translate", "v2", "meta", norm, "synonyms"),
        k("translate", "v2", "meta", norm, "antonyms"),
        k("translate", "v2", "meta", norm, "sentences"),
    ])
    return keys


MIN_VARIANTS = 5
MAX_VARIANTS = 10


async def get_text_cache_keys(base_key: str):
    variants_key = k(base_key, "variants")

    count = await redis.scard(variants_key)
    backend_logger.info(f"[TEXT CACHE] base_key={base_key}, variants count={count}")

    # Пока вариантов меньше 5 — создаём новый
    if count < MIN_VARIANTS:
        return None

    # Есть 5 и больше — выбираем случайный готовый вариант
    variants = await redis.smembers(variants_key)
    backend_logger.info(f"[TEXT CACHE] variants={variants}, count={count}")
    variant_id = await redis.srandmember(variants_key)
    backend_logger.info(f"[TEXT CACHE] Selected variant={variant_id}, count={count}")

    if variant_id is None:
        return None

    text_key = k(base_key, variant_id, "text")
    translation_key = k(base_key, variant_id, "translation")
    backend_logger.info(f"[TEXT CACHE] Selected variant={variant_id}, count={count}")

    return base_key, text_key, translation_key


async def save_text_cache_variant(
    base_key: str,
    text: str,
    text_translation: str,
):
    variants_key = k(base_key, "variants")

    # Проверяем количество ДО сохранения
    count = await redis.scard(variants_key)

    if count >= MAX_VARIANTS:
        backend_logger.info(f"[TEXT CACHE] Max variants reached: {count}")
        return None

    variant_id = uuid.uuid4().hex[:12]

    text_key = k(base_key, variant_id, "text")
    translation_key = k(base_key, variant_id, "translation")

    # AtomicCache хранит JSON,
    # поэтому здесь сохраняем в том же формате
    await redis.set(
        text_key,
        json.dumps(text, ensure_ascii=False),
        ex=TTL_FULL,
    )

    await redis.set(
        translation_key,
        json.dumps(text_translation, ensure_ascii=False),
        ex=TTL_FULL,
    )

    # Регистрируем вариант
    await redis.sadd(
        variants_key,
        variant_id,
    )

    # TTL самого SET со списком вариантов
    await redis.expire(
        variants_key,
        TTL_FULL,
    )

    # Проверяем количество ПОСЛЕ сохранения
    new_count = await redis.scard(variants_key)

    backend_logger.info(
        f"[TEXT CACHE] New variant saved: {variant_id}, "
        f"count: {count} -> {new_count}"
    )

    return base_key, text_key, translation_key