from collections import defaultdict

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.engine.chunk_candidate import ChunkCandidate


LEVEL_RANK = {
    "A1": 1,
    "A2": 2,
    "B1": 3,
    "B2": 4,
    "C1": 5,
    "C2": 6,
}


async def get_candidate_pools(
    session: AsyncSession,
    block_codes: list[str],
    language: str,
    level: str,
) -> dict[str, list[ChunkCandidate]]:
    """
    Загружает кандидатов для блоков шаблона и группирует их
    по block_code.

    Кандидат подходит, если:
    - он активен;
    - его block_code присутствует в шаблоне;
    - его уровень не выше уровня запроса;
    - в candidate имеется непустое значение нужного языка.
    """

    unique_block_codes = list(dict.fromkeys(block_codes))

    statement = (
        select(ChunkCandidate)
        .where(
            ChunkCandidate.block_code.in_(unique_block_codes),
            ChunkCandidate.active.is_(True),
        )
        .order_by(
            ChunkCandidate.block_code,
            ChunkCandidate.id,
        )
    )

    candidates_result = await session.scalars(statement)
    candidates = list(candidates_result.unique().all())

    requested_level_rank = LEVEL_RANK[level]

    pools: dict[str, list[ChunkCandidate]] = defaultdict(list)

    for candidate in candidates:
        candidate_level_rank = LEVEL_RANK.get(candidate.level)

        if candidate_level_rank is None:
            continue

        if candidate_level_rank > requested_level_rank:
            continue

        language_value = candidate.candidate.get(language)

        if not isinstance(language_value, str):
            continue

        if not language_value.strip():
            continue

        pools[candidate.block_code].append(candidate)

    # Возвращаем все блоки, включая те, для которых ничего не найдено.
    return {
        block_code: pools.get(block_code, [])
        for block_code in unique_block_codes
    }