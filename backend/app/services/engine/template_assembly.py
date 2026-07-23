from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.engine.template import Template
from app.engine.assembler import SentenceAssembler, parse_pattern
from app.engine.candidate_loader import load_candidates
from app.engine.errors import EngineError, EngineErrorCode
from app.engine.types import AssemblyResult


async def assemble_template(
    session: AsyncSession,
    *,
    template: Template,
    language: str,
    level: str,
    tense: str,
    assembler: SentenceAssembler | None = None,
    recent_candidate_ids: set[int] | None = None,
) -> AssemblyResult:
    render_pattern = template.code.get(language)
    if not isinstance(render_pattern, (str, list)) or not render_pattern:
        raise EngineError(
            EngineErrorCode.LANGUAGE_NOT_AVAILABLE,
            f"Template {template.id} has no DSL for language '{language}'",
            debug={"template_id": template.id, "language": language},
        )

    resolve_pattern = template.resolve_order.get(language) or render_pattern
    block_codes = set(parse_pattern(render_pattern))
    candidates = await load_candidates(
        session,
        block_codes=block_codes,
        language=language,
    )
    return (assembler or SentenceAssembler()).assemble(
        template_id=template.id,
        template_key=template.template_key,
        render_pattern=render_pattern,
        resolve_pattern=resolve_pattern,
        candidates=candidates,
        level=level,
        tense=tense,
        recent_candidate_ids=recent_candidate_ids,
    )
