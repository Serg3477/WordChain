import hashlib
import secrets
from app.utils.cache import redis, k


RESET_TOKEN_TTL_SECONDS = 15 * 60


def generate_reset_token() -> str:
    return secrets.token_urlsafe(32)


def hash_reset_token(token: str) -> str:
    return hashlib.sha256(
        token.encode("utf-8")
    ).hexdigest()

def reset_token_key(token_hash: str) -> str:
    return k(
        "password_reset",
        "v1",
        token_hash
    )


async def save_reset_token(
    token_hash: str,
    user_id: int
) -> None:
    await redis.set(
        reset_token_key(token_hash),
        str(user_id),
        ex=RESET_TOKEN_TTL_SECONDS
    )


async def get_reset_user_id(
    token_hash: str
) -> int | None:
    user_id = await redis.get(
        reset_token_key(token_hash)
    )

    if user_id is None:
        return None

    return int(user_id)


async def delete_reset_token(
    token_hash: str
) -> None:
    await redis.delete(
        reset_token_key(token_hash)
    )

