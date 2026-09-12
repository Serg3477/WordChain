from __future__ import annotations

import random
from collections import defaultdict, deque
from collections.abc import Mapping, Sequence
from dataclasses import dataclass
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.engine.chunk_candidate import ChunkCandidate
from app.db.models.engine.template import Template


LEVEL_RANK = {
    "A1": 1,
    "A2": 2,
    "B1": 3,
    "B2": 4,
    "C1": 5,
    "C2": 6,
}


class CandidateSelectionError(Exception):
    def __init__(
        self,
        code: str,
        message: str,
        *,
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message)
        self.code = code
        self.details = details or {}


@dataclass(frozen=True, slots=True)
class CandidateData:
    id: int
    block_code: str
    text: str
    self_features: dict[str, Any]
    match_features: dict[str, Any]


@dataclass(frozen=True, slots=True)
class SelectedBlock:
    position: int
    block_code: str
    candidate_id: int
    text: str


@dataclass(frozen=True, slots=True)
class BuiltSentence:
    sentence: str
    template_id: int
    template_key: str
    render_order: list[str]
    resolve_order: list[str]
    selected_blocks: list[SelectedBlock]


def _tokens(pattern: str | Sequence[str]) -> list[str]:
    if isinstance(pattern, str):
        return pattern.split()
    return [str(token) for token in pattern]


def _as_values(value: Any) -> list[Any]:
    if isinstance(value, (list, tuple, set, frozenset)):
        return list(value)
    return [value]


def values_match(required: Any, actual: Any) -> bool:
    """
    Scalars must be equal. If either side is a collection, at least one value
    must intersect. This covers scalar/list and list/list JSONB values.
    """
    required_values = _as_values(required)
    actual_values = _as_values(actual)
    return any(
        required_value == actual_value
        for required_value in required_values
        for actual_value in actual_values
    )


def all_requirements_match(
    requirements: Mapping[str, Any],
    features: Mapping[str, Any],
) -> bool:
    """
    Compare every feature that is present on both sides.

    Candidate data is intentionally sparse. A missing feature is not a
    contradiction: for example, agreement="3sg" may already be sufficient
    even when the previous candidate also exposes person and number.

    An explicitly conflicting shared feature always rejects the candidate.
    """
    shared_keys = requirements.keys() & features.keys()
    return all(
        values_match(requirements[key], features[key])
        for key in shared_keys
    )


def candidate_level_allowed(
    candidate_level: str,
    requested_level: str,
) -> bool:
    try:
        return LEVEL_RANK[candidate_level] <= LEVEL_RANK[requested_level]
    except KeyError as exc:
        raise CandidateSelectionError(
            "UNKNOWN_LEVEL",
            f"Unknown CEFR level: {exc.args[0]}",
        ) from exc


def candidate_tense_allowed(
    self_features: Mapping[str, Any],
    requested_tense: str,
) -> bool:
    candidate_tense = self_features.get("tense")
    return (
        candidate_tense is None
        or values_match(requested_tense, candidate_tense)
    )


def _resolution_positions(
    render_order: Sequence[str],
    resolve_order: Sequence[str],
) -> list[tuple[int, str]]:
    """
    Bind resolve-order block names to concrete render positions.

    Position binding is required because one block code may occur more than
    once in a template.
    """
    available_positions: dict[str, deque[int]] = defaultdict(deque)
    for position, block_code in enumerate(render_order):
        available_positions[block_code].append(position)

    result: list[tuple[int, str]] = []
    for block_code in resolve_order:
        positions = available_positions.get(block_code)
        if not positions:
            raise CandidateSelectionError(
                "INVALID_RESOLVE_ORDER",
                f"Unknown or repeated excess block '{block_code}'",
            )
        result.append((positions.popleft(), block_code))

    unresolved = [
        position
        for positions in available_positions.values()
        for position in positions
    ]
    if unresolved:
        raise CandidateSelectionError(
            "INVALID_RESOLVE_ORDER",
            "resolve_order does not contain every template position",
            details={"unresolved_positions": sorted(unresolved)},
        )
    return result


def _language_dict(
    value: Any,
    *,
    language: str,
) -> dict[str, Any]:
    if not isinstance(value, dict):
        return {}
    language_value = value.get(language, {})
    return language_value if isinstance(language_value, dict) else {}


def _to_candidate(
    row: ChunkCandidate,
    *,
    language: str,
    tense: str,
) -> CandidateData | None:
    text = row.candidate.get(language)
    if not isinstance(text, str) or not text.strip():
        return None

    self_features = _language_dict(
        row.self_features,
        language=language,
    )
    if not candidate_tense_allowed(self_features, tense):
        return None

    return CandidateData(
        id=row.id,
        block_code=row.block_code,
        text=text.strip(),
        self_features=self_features,
        match_features=_language_dict(
            row.match_features,
            language=language,
        ),
    )


async def _load_pool(
    session: AsyncSession,
    *,
    block_code: str,
    language: str,
    level: str,
    tense: str,
) -> list[CandidateData]:
    allowed_levels = [
        candidate_level
        for candidate_level in LEVEL_RANK
        if candidate_level_allowed(candidate_level, level)
    ]
    statement = (
        select(ChunkCandidate)
        .where(
            ChunkCandidate.active.is_(True),
            ChunkCandidate.block_code == block_code,
            ChunkCandidate.level.in_(allowed_levels),
        )
        .order_by(ChunkCandidate.id)
    )
    rows = (await session.scalars(statement)).all()
    return [
        candidate
        for row in rows
        if (
            candidate := _to_candidate(
                row,
                language=language,
                tense=tense,
            )
        )
        is not None
    ]


async def build_sentence(
    session: AsyncSession,
    *,
    template: Template,
    language: str,
    level: str,
    tense: str,
    rng: random.Random | None = None,
) -> BuiltSentence:
    """
    Fill one already-selected template without cache, scores or map tables.

    Selection rule:
    1. Choose the first resolved block randomly.
    2. For every next block, compare all features that exist in both the
       previous candidate's match and the current candidate's self.
       Missing features are ignored; conflicting shared features reject.
    3. Choose randomly among the remaining compatible candidates.
    """
    language = language.strip().lower()
    level = level.strip().upper()
    tense = tense.strip().upper().replace(" ", "_")
    randomizer = rng or random.Random()

    render_pattern = template.code.get(language)
    if not isinstance(render_pattern, (str, list)) or not render_pattern:
        raise CandidateSelectionError(
            "LANGUAGE_NOT_AVAILABLE",
            f"Template {template.id} has no '{language}' pattern",
        )

    render_order = _tokens(render_pattern)
    raw_resolve_order = (
        template.resolve_order.get(language)
        if isinstance(template.resolve_order, dict)
        else None
    )
    resolve_order = _tokens(raw_resolve_order or render_pattern)
    positions = _resolution_positions(render_order, resolve_order)

    selected: dict[int, CandidateData] = {}
    previous: CandidateData | None = None

    for position, block_code in positions:
        pool = await _load_pool(
            session,
            block_code=block_code,
            language=language,
            level=level,
            tense=tense,
        )
        if not pool:
            raise CandidateSelectionError(
                "NO_BLOCK_CANDIDATES",
                f"No candidates for block '{block_code}'",
                details={
                    "position": position,
                    "block_code": block_code,
                    "language": language,
                    "level": level,
                    "tense": tense,
                },
            )

        compatible = (
            pool
            if previous is None
            else [
                candidate
                for candidate in pool
                if all_requirements_match(
                    previous.match_features,
                    candidate.self_features,
                )
            ]
        )
        if not compatible:
            raise CandidateSelectionError(
                "CANDIDATE_MATCH_FAILED",
                f"No compatible candidates for block '{block_code}'",
                details={
                    "position": position,
                    "block_code": block_code,
                    "previous_candidate_id": (
                        previous.id if previous is not None else None
                    ),
                    "required_features": (
                        previous.match_features
                        if previous is not None
                        else {}
                    ),
                    "pool_size": len(pool),
                },
            )

        chosen = randomizer.choice(compatible)
        selected[position] = chosen
        previous = chosen

    selected_blocks = [
        SelectedBlock(
            position=position,
            block_code=block_code,
            candidate_id=selected[position].id,
            text=selected[position].text,
        )
        for position, block_code in enumerate(render_order)
    ]
    return BuiltSentence(
        sentence=" ".join(block.text for block in selected_blocks),
        template_id=template.id,
        template_key=template.template_key,
        render_order=list(render_order),
        resolve_order=list(resolve_order),
        selected_blocks=selected_blocks,
    )
