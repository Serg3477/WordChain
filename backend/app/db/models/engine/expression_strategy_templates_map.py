from __future__ import annotations
from sqlalchemy import BigInteger, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.orm import relationship

from app.db.engine_base import EngineBase

from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from app.db.models.engine.expression_strategy import ExpressionStrategy
    from app.db.models.engine.template import (
        Template
    )



class ExpressionStrategyTemplatesMap(EngineBase):
    __tablename__ = "expression_strategy_templates_map"

    expression_strategy_id: Mapped[int] = mapped_column(Integer, ForeignKey("expression_strategy.id"), primary_key=True, nullable=False)
    template_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("templates.id"), primary_key=True, nullable=False)

    expression_strategy: Mapped["ExpressionStrategy"] = relationship(
        back_populates="template_links",
    )
    template: Mapped["Template"] = relationship(
        back_populates="expression_strategy_links",
    )