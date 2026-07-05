# --- Общая утилита кеширования JSON-значений в Redis ---
from typing import Iterable, List
from redis.asyncio import Redis
from app.utils.atomic_cache import AtomicCache
from app.logger.logger import backend_logger

TTL_FULL = 60 * 60 * 24 * 30
TTL_PARTS = 60 * 60 * 24 * 30

# redis = Redis.from_url("redis://localhost:6379", decode_responses=True)      # Dev-mode
redis = Redis.from_url("redis://redis:6379", decode_responses=True)        # Docker-mode

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
