from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy import BigInteger, Boolean, String, text
from sqlalchemy.dialects.postgresql import JSONB, TIMESTAMP
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.orm import relationship

from app.db.engine_base import EngineBase
from app.db.models.engine.expression_strategy_templates_map import ExpressionStrategyTemplatesMap


class Template(EngineBase):
    __tablename__ = "templates"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    code: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    level: Mapped[str] = mapped_column(String, nullable=False)
    tense: Mapped[str] = mapped_column(String, nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("true"))
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=False), nullable=False, server_default=text("CURRENT_TIMESTAMP"))
    template_key: Mapped[str] = mapped_column(String, nullable=False)
    resolve_order: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))

    expression_strategy_links: Mapped[
        list["ExpressionStrategyTemplatesMap"]
    ] = relationship(
        back_populates="template",
        cascade="all, delete-orphan",
    )