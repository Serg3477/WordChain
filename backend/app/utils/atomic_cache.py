import asyncio
import json
from typing import Callable, Any


class AtomicCache:
    def __init__(self, redis, default_ttl: int = 3600, lock_ttl: int = 5):
        self.redis = redis
        self.default_ttl = default_ttl
        self.lock_ttl = lock_ttl

    async def get_or_set(
        self,
        key: str,
        producer: Callable[[], Any],
        ttl: int | None = None
    ):
        ttl = ttl or self.default_ttl

        # 1. Попытка взять значение из кэша
        cached = await self.redis.get(key)
        if cached is not None:
            return json.loads(cached)

        # 2. Пытаемся взять lock
        lock_key = f"{key}:lock"
        got_lock = await self.redis.set(lock_key, "1", ex=self.lock_ttl, nx=True)

        if got_lock:
            # 3. Мы первые — вычисляем producer()
            try:
                value = await producer()
                await self.redis.set(
                    key,
                    json.dumps(value, ensure_ascii=False),
                    ex=ttl
                )
                return value
            finally:
                await self.redis.delete(lock_key)

        # 4. Если lock не наш — ждём появления значения
        for _ in range(50):  # максимум 5 секунд
            await asyncio.sleep(0.1)
            cached = await self.redis.get(key)
            if cached is not None:
                return json.loads(cached)

        # 5. Fallback — если lock завис
        value = await producer()
        await self.redis.set(
            key,
            json.dumps(value, ensure_ascii=False),
            ex=ttl
        )
        return value
