# --- Общая утилита кеширования JSON-значений в Redis ---
from typing import Iterable, List
from redis.asyncio import Redis
import json
from app.utils.atomic_cache import AtomicCache
from app.logger.logger import backend_logger



TTL_FULL = 60 * 60 * 24 * 30
TTL_PARTS = 60 * 60 * 24 * 30

redis = Redis.from_url("redis://localhost:6379", decode_responses=True)      # Dev-mode (desktop)
# redis = Redis.from_url("redis://redis:6379", decode_responses=True)        # Docker-mode

cache = AtomicCache(redis, default_ttl=TTL_PARTS)

async def _get_cached_json(key: str, producer, ttl: int = TTL_PARTS):
    """
    Проверяет Redis по ключу key:
      - если есть, пытается распарсить JSON и вернуть объект;
      - если парсинг не удался — удаляет ключ и вызывает producer();
      - если нет — вызывает producer(), сериализует результат в JSON и сохраняет в Redis.
    producer может возвращать list/dict/str и т.д.
    """
    try:
        cached_raw = await cache.get(key)
    except Exception:
        cached_raw = None

    if cached_raw:
        try:
            # cached_raw может быть строкой JSON или уже сериализованным объектом
            return json.loads(cached_raw) if isinstance(cached_raw, str) else cached_raw
        except Exception:
            # повреждённый кеш — удаляем и продолжаем
            try:
                await redis.delete(key)
            except Exception:
                backend_logger.exception("Failed to delete corrupted cache key %s", key)

    # Получаем свежие данные
    result = await producer()

    # Сохраняем в кеш (если получилось)
    try:
        await redis.set(key, json.dumps(result, ensure_ascii=False), ex=ttl)
    except Exception:
        backend_logger.exception("Failed to set cache for %s", key)

    return result

async def get_full_cached(full_key: str):
    try:
        raw = await redis.get(full_key)
    except Exception:
        raw = None
    if not raw:
        return None
    try:
        return json.loads(raw)
    except Exception:
        try:
            await redis.delete(full_key)
        except Exception:
            backend_logger.exception("Failed to delete corrupted full cache %s", full_key)
        return None

async def set_full_cache(full_key: str, obj: dict, ttl: int):
    try:
        await redis.set(full_key, json.dumps(obj, ensure_ascii=False), ex=ttl)
    except Exception:
        backend_logger.exception("Failed to set full cache %s", full_key)


async def delete_keys(*keys: str) -> None:
    """
    Удаляет ключи из Redis. Безопасно логирует ошибки.
    Принимает 0+ ключей.
    """
    if not keys:
        return
    try:
        # redis.delete принимает несколько аргументов
        await redis.delete(*[k for k in keys if k])
    except Exception:
        backend_logger.exception("Failed to delete cache keys: %s", keys)


def collect_translation_keys(word: str, srcs: Iterable[str] = ("auto",), tgts: Iterable[str] = ("ru",)) -> List[str]:
    """
    Собирает список ключей, которые нужно инвалидировать для данного слова.
    По умолчанию собирает для src='auto' и tgt='ru'. При необходимости передавайте все src/tgt комбинации.
    """
    norm = word.strip().lower()
    keys = []
    for src in srcs:
        for tgt in tgts:
            base = f"translate:v2:{src}:{tgt}:{norm}"
            keys.extend([
                f"{base}:full",
                f"{base}:translation",
                f"{base}:transcription",
                f"{base}:part_of_speech",
                f"{base}:better_translation",
            ])
    # meta keys
    keys.extend([
        f"translate:v2:meta:{norm}:synonyms",
        f"translate:v2:meta:{norm}:antonyms",
        f"translate:v2:meta:{norm}:sentences",
    ])
    return keys