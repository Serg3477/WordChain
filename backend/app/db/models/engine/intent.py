from __future__ import annotations
from datetime import datetime
from typing import Any
from sqlalchemy import Boolean, Integer, String, text
from sqlalchemy.dialects.postgresql import JSONB, TIMESTAMP
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.orm import relationship

from app.db.engine_base import EngineBase

from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from app.db.models.engine.expression_strategy import ExpressionStrategy
    from app.db.models.engine.intent_expression_strategy_map import (
        IntentExpressionStrategyMap,
    )



class Intent(EngineBase):
    __tablename__ = "intents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    code: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    category: Mapped[str] = mapped_column(String, nullable=False)
    min_level: Mapped[str] = mapped_column(String, nullable=False, server_default=text("'A1'"))
    max_level: Mapped[str] = mapped_column(String, nullable=False, server_default=text("'C2'"))
    semantic_tags: Mapped[list[Any] | None] = mapped_column(JSONB, nullable=True, server_default=text("'[]'::jsonb"))
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("true"))
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=False), nullable=False, server_default=text("now()"))

    expression_strategy_links: Mapped[
        list["IntentExpressionStrategyMap"]
    ] = relationship(
        back_populates="intent",
        cascade="all, delete-orphan",
    )