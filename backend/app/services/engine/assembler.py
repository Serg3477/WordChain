from __future__ import annotations

import random
from collections import defaultdict, deque
from collections.abc import Iterable, Sequence
from dataclasses import asdict
from typing import Any

from app.engine.errors import EngineError, EngineErrorCode
from app.engine.matcher import candidates_are_compatible
from app.engine.types import (
    AssemblyDebug,
    AssemblyResult,
    BlockPosition,
    CandidateView,
    SelectedChunk,
)

LEVEL_RANK = {
    "A1": 1,
    "A2": 2,
    "B1": 3,
    "B2": 4,
    "C1": 5,
    "C2": 6,
}


def parse_pattern(pattern: str | Sequence[str]) -> list[str]:
    if isinstance(pattern, str):
        return pattern.split()
    return [str(item) for item in pattern]


def build_resolution_positions(
    render_order: Sequence[str],
    resolve_order: Sequence[str],
) -> list[BlockPosition]:
    """Map resolve-order tokens to their concrete positions in render order."""
    positions: dict[str, deque[int]] = defaultdict(deque)
    for index, block_code in enumerate(render_order):
        positions[block_code].append(index)

    result: list[BlockPosition] = []
    for block_code in resolve_order:
        if not positions[block_code]:
            raise EngineError(
                EngineErrorCode.RESOLUTION_FAILED,
                f"resolve_order contains unknown or excess block '{block_code}'",
            )
        result.append(
            BlockPosition(
                index=positions[block_code].popleft(),
                block_code=block_code,
            )
        )

    unresolved = [
        BlockPosition(index=index, block_code=block_code)
        for block_code, indexes in positions.items()
        for index in indexes
    ]
    if unresolved:
        raise EngineError(
            EngineErrorCode.RESOLUTION_FAILED,
            "resolve_order does not contain every render position",
            debug={"unresolved_positions": [item.index for item in unresolved]},
        )
    return result


def candidate_level_allowed(candidate_level: str, requested_level: str) -> bool:
    try:
        return LEVEL_RANK[candidate_level] <= LEVEL_RANK[requested_level]
    except KeyError as exc:
        raise EngineError(
            EngineErrorCode.RESOLUTION_FAILED,
            f"Unknown CEFR level: {exc.args[0]}",
        ) from exc


def candidate_tense_allowed(
    self_features: dict[str, Any],
    requested_tense: str,
) -> bool:
    tense = self_features.get("tense")
    if tense is None:
        return True
    values = tense if isinstance(tense, list) else [tense]
    return requested_tense in values


class SentenceAssembler:
    def __init__(self, rng: random.Random | None = None) -> None:
        self._rng = rng or random.Random()

    def assemble(
        self,
        *,
        template_id: int,
        template_key: str,
        render_pattern: str | Sequence[str],
        resolve_pattern: str | Sequence[str] | None,
        candidates: Iterable[CandidateView],
        level: str,
        tense: str,
        recent_candidate_ids: set[int] | None = None,
    ) -> AssemblyResult:
        render_order = parse_pattern(render_pattern)
        resolve_order = parse_pattern(resolve_pattern or render_pattern)
        resolution_positions = build_resolution_positions(
            render_order,
            resolve_order,
        )
        debug = AssemblyDebug(
            template_id=template_id,
            template_key=template_key,
            render_order=render_order,
            resolve_order=resolve_order,
        )

        pools: dict[int, list[CandidateView]] = {}
        candidate_list = list(candidates)
        for position in resolution_positions:
            pool = [
                item
                for item in candidate_list
                if item.block_code == position.block_code
                and candidate_level_allowed(item.level, level)
                and candidate_tense_allowed(item.self_features, tense)
            ]
            pools[position.index] = pool
            debug.pool_sizes[position.index] = len(pool)
            if not pool:
                debug.failed_position = position.index
                debug.failed_block = position.block_code
                raise EngineError(
                    EngineErrorCode.NO_BLOCK_CANDIDATES,
                    f"No candidates for block '{position.block_code}'",
                    debug=asdict(debug),
                )

        selected: dict[int, CandidateView] = {}
        recent_ids = recent_candidate_ids or set()

        def search(step: int, previous: CandidateView | None) -> bool:
            if step == len(resolution_positions):
                return True

            position = resolution_positions[step]
            pool = pools[position.index].copy()
            self._rng.shuffle(pool)
            # Cache integration point: prefer fresh candidates, but never turn
            # recent history into a hard failure.
            pool.sort(key=lambda item: item.id in recent_ids)

            compatible_found = False
            for candidate in pool:
                debug.attempts += 1
                if previous is not None and not candidates_are_compatible(
                    previous.match_features,
                    candidate.self_features,
                ):
                    continue

                compatible_found = True
                selected[position.index] = candidate
                if search(step + 1, candidate):
                    return True
                selected.pop(position.index, None)
                debug.backtracks += 1

            debug.failed_position = position.index
            debug.failed_block = position.block_code
            return False

        if not search(0, None):
            raise EngineError(
                EngineErrorCode.CANDIDATE_MATCH_FAILED,
                "Candidate pools exist, but no compatible full chain was found",
                debug=asdict(debug),
            )

        chunks = [
            SelectedChunk(
                position=index,
                block_code=render_order[index],
                candidate_id=selected[index].id,
                text=selected[index].text,
            )
            for index in range(len(render_order))
        ]
        return AssemblyResult(
            sentence=" ".join(chunk.text for chunk in chunks),
            template_id=template_id,
            template_key=template_key,
            selected_chunks=chunks,
            debug=debug,
        )
