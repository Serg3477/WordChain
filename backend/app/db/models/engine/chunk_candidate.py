from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy import BigInteger, Boolean, String, text
from sqlalchemy.dialects.postgresql import JSONB, TIMESTAMP
from sqlalchemy.orm import Mapped, mapped_column

from app.db.engine_base import EngineBase



class ChunkCandidate(EngineBase):
    __tablename__ = "chunk_candidates"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    block_code: Mapped[str] = mapped_column(String, nullable=False)
    candidate: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    level: Mapped[str] = mapped_column(String, nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("true"))
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=False), nullable=False, server_default=text("CURRENT_TIMESTAMP"))
    self_features: Mapped[dict[str, Any]] = mapped_column("self", JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    match_features: Mapped[dict[str, Any]] = mapped_column("match", JSONB, nullable=False, server_default=text("'{}'::jsonb"))