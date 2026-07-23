from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass(frozen=True, slots=True)
class BlockPosition:
    index: int
    block_code: str


@dataclass(frozen=True, slots=True)
class CandidateView:
    id: int
    block_code: str
    text: str
    level: str
    self_features: dict[str, Any]
    match_features: dict[str, Any]


@dataclass(slots=True)
class AssemblyDebug:
    template_id: int
    template_key: str
    render_order: list[str]
    resolve_order: list[str]
    pool_sizes: dict[int, int] = field(default_factory=dict)
    attempts: int = 0
    backtracks: int = 0
    failed_position: int | None = None
    failed_block: str | None = None


@dataclass(frozen=True, slots=True)
class SelectedChunk:
    position: int
    block_code: str
    candidate_id: int
    text: str


@dataclass(frozen=True, slots=True)
class AssemblyResult:
    sentence: str
    template_id: int
    template_key: str
    selected_chunks: list[SelectedChunk]
    debug: AssemblyDebug
