from __future__ import annotations

from collections.abc import Iterable

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.engine.chunk_candidate import ChunkCandidate
from app.engine.types import CandidateView


def to_candidate_view(
    row: ChunkCandidate,
    *,
    language: str,
) -> CandidateView | None:
    text = row.candidate.get(language)
    if not isinstance(text, str) or not text.strip():
        return None

    self_features = row.self_features.get(language, {})
    match_features = row.match_features.get(language, {})
    return CandidateView(
        id=row.id,
        block_code=row.block_code,
        text=text.strip(),
        level=row.level,
        self_features=(
            self_features if isinstance(self_features, dict) else {}
        ),
        match_features=(
            match_features if isinstance(match_features, dict) else {}
        ),
    )


async def load_candidates(
    session: AsyncSession,
    *,
    block_codes: Iterable[str],
    language: str,
) -> list[CandidateView]:
    """
    SQL performs stable row filters; language and JSON are interpreted in Python.
    """
    statement = (
        select(ChunkCandidate)
        .where(
            ChunkCandidate.active.is_(True),
            ChunkCandidate.block_code.in_(set(block_codes)),
        )
        .order_by(ChunkCandidate.block_code, ChunkCandidate.id)
    )
    rows = (await session.scalars(statement)).all()
    return [
        view
        for row in rows
        if (view := to_candidate_view(row, language=language)) is not None
    ]
