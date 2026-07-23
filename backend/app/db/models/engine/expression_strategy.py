from __future__ import annotations
from datetime import datetime
from typing import Any
from sqlalchemy import Boolean, Integer, text
from sqlalchemy.dialects.postgresql import JSONB, TIMESTAMP
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.orm import relationship

from app.db.engine_base import EngineBase

from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from app.db.models.engine.expression_strategy_templates_map import ExpressionStrategyTemplatesMap
    from app.db.models.engine.intent_expression_strategy_map import (
        IntentExpressionStrategyMap,
    )

class ExpressionStrategy(EngineBase):
    __tablename__ = "expression_strategy"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("true"))
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=False), nullable=False, server_default=text("now()"))
    code: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)

    intent_links: Mapped[
        list["IntentExpressionStrategyMap"]
    ] = relationship(
        back_populates="expression_strategy",
        cascade="all, delete-orphan",
    )
    template_links: Mapped[
        list["ExpressionStrategyTemplatesMap"]
    ] = relationship(
        back_populates="expression_strategy",
        cascade="all, delete-orphan",
    )