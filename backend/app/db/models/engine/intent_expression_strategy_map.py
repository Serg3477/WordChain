from __future__ import annotations
from sqlalchemy import BigInteger, Boolean, ForeignKey, Integer, text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.orm import relationship

from app.db.engine_base import EngineBase

from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from app.db.models.engine.expression_strategy import ExpressionStrategy
    from app.db.models.engine.intent import Intent


class IntentExpressionStrategyMap(EngineBase):
    __tablename__ = "intent_expression_strategy_map"

    intent_id: Mapped[int] = mapped_column(Integer, ForeignKey("intents.id"), primary_key=True, nullable=False)
    expression_strategy_id: Mapped[int] = mapped_column(Integer, ForeignKey("expression_strategy.id"), primary_key=True, nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("true"))

    intent: Mapped["Intent"] = relationship(
        back_populates="expression_strategy_links",
    )
    expression_strategy: Mapped["ExpressionStrategy"] = relationship(
        back_populates="intent_links",
    )


