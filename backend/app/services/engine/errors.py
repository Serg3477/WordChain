from __future__ import annotations

from enum import StrEnum
from typing import Any


class EngineErrorCode(StrEnum):
    INTENT_NOT_FOUND = "INTENT_NOT_FOUND"
    NO_ACTIVE_STRATEGIES = "NO_ACTIVE_STRATEGIES"
    NO_CONNECTED_TEMPLATES = "NO_CONNECTED_TEMPLATES"
    LANGUAGE_NOT_AVAILABLE = "LANGUAGE_NOT_AVAILABLE"
    NO_BLOCK_CANDIDATES = "NO_BLOCK_CANDIDATES"
    CANDIDATE_MATCH_FAILED = "CANDIDATE_MATCH_FAILED"
    RESOLUTION_FAILED = "RESOLUTION_FAILED"


class EngineError(Exception):
    def __init__(
        self,
        code: EngineErrorCode,
        message: str,
        *,
        debug: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.debug = debug or {}
