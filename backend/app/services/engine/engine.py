from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.engine.intent import Intent
from app.db.models.engine.expression_strategy import ExpressionStrategy
from app.db.models.engine.intent_expression_strategy_map import (
    IntentExpressionStrategyMap,
)
from app.db.models.engine.template import Template
from app.db.models.engine.expression_strategy_templates_map import (
    ExpressionStrategyTemplatesMap,
)
from app.schemas.engine.engine import EngineRequest
from app.services.engine.candidate_selector import get_candidate_pools


LEVEL_RANK = {
    "A1": 1,
    "A2": 2,
    "B1": 3,
    "B2": 4,
    "C1": 5,
    "C2": 6,
}


async def get_engine(
    session: AsyncSession,
    req: EngineRequest,
) -> str:
    language = req.language.strip().lower()
    level = req.level.strip().upper()
    intent_code = req.intent.strip().upper()
    tense = req.tense.strip().upper().replace(" ", "_")

    # =========================================================
    # 1. Проверка уровня
    # =========================================================

    if level not in LEVEL_RANK:
        raise HTTPException(
            status_code=422,
            detail=f"Unsupported level: '{level}'",
        )

    # =========================================================
    # 2. Intent
    #
    # Frontend отправляет готовый system-код:
    # STATE_FACT, DESCRIBE_ACTION и т. д.
    # =========================================================

    intent_statement = (
        select(Intent)
        .where(
            Intent.code["system"].astext == intent_code,
            Intent.active.is_(True),
        )
        .limit(1)
    )

    intent = await session.scalar(intent_statement)

    if intent is None:
        raise HTTPException(
            status_code=404,
            detail=f"Intent system code '{intent_code}' was not found",
        )

    if intent is None:
        raise HTTPException(
            status_code=404,
            detail=f"Intent system code '{intent_code}' was not found",
        )

    # =========================================================
    # 3. ExpressionStrategy
    # =========================================================

    strategy_statement = (
        select(ExpressionStrategy)
        .join(
            IntentExpressionStrategyMap,
            IntentExpressionStrategyMap.expression_strategy_id
            == ExpressionStrategy.id,
        )
        .where(
            IntentExpressionStrategyMap.intent_id == intent.id,
            IntentExpressionStrategyMap.active.is_(True),
            ExpressionStrategy.active.is_(True),
        )
        .distinct()
        .order_by(ExpressionStrategy.id)
    )

    strategies_result = await session.scalars(strategy_statement)
    strategies = list(strategies_result.unique().all())

    if not strategies:
        raise HTTPException(
            status_code=404,
            detail=(
                "No active ExpressionStrategy found: "
                f"intent_id={intent.id}, "
                f"intent_code='{intent_code}'"
            ),
        )

    strategy_ids = [
        strategy.id
        for strategy in strategies
    ]

    # =========================================================
    # 4. Template
    #
    # Язык не участвует в SQL-выборке строк Template.
    # Каждый Template уже содержит en, fr и другие языки
    # внутри одного JSONB-поля code.
    # =========================================================

    template_statement = (
        select(Template)
        .join(
            ExpressionStrategyTemplatesMap,
            ExpressionStrategyTemplatesMap.template_id
            == Template.id,
        )
        .where(
            ExpressionStrategyTemplatesMap.expression_strategy_id.in_(
                strategy_ids
            ),
            Template.active.is_(True),
            Template.level == level,
            Template.tense == tense,
        )
        .distinct()
        .order_by(Template.id)
    )

    templates_result = await session.scalars(template_statement)

    templates_before_language = list(
        templates_result.unique().all()
    )

    if not templates_before_language:
        raise HTTPException(
            status_code=404,
            detail=(
                "No templates connected to selected strategies: "
                f"intent_id={intent.id}, "
                f"intent_code='{intent_code}', "
                f"strategy_ids={strategy_ids}, "
                f"level='{level}', "
                f"tense='{tense}'"
            ),
        )

    # Проверяем наличие нужной языковой формы уже в Python.

    templates = [
        template
        for template in templates_before_language
        if isinstance(template.code.get(language), str)
        and template.code[language].strip()
    ]

    if not templates:
        available_languages = sorted({
            language_code
            for template in templates_before_language
            for language_code, value in template.code.items()
            if isinstance(value, str) and value.strip()
        })

        raise HTTPException(
            status_code=404,
            detail=(
                f"Templates were found, but language '{language}' "
                "is unavailable. "
                f"Available languages: {available_languages}"
            ),
        )

    # =========================================================
    # 5. Временная диагностика
    # =========================================================

    print(
        "ENGINE DIAGNOSTICS:",
        {
            "language": language,
            "level": level,
            "intent_code": intent_code,
            "intent_id": intent.id,
            "tense": tense,
            "strategy_ids": strategy_ids,
            "templates_before_language": len(
                templates_before_language
            ),
            "templates_after_language": len(templates),
            "template_ids": [
                template.id
                for template in templates
            ],
        },
    )

    # =========================================================
    # 6. Временный текстовый результат
    # =========================================================

    strategies_text = ", ".join(
        (
            f"{strategy.id}: "
            f"{strategy.code.get(language) or strategy.code.get('en')} "
            f"({strategy.code.get('system')})"
        )
        for strategy in strategies
    )

    templates_text = " | ".join(
        (
            f"code={template.code.get(language)},\n "
            f"resolve_order={(
                template.resolve_order.get(language)
                if template.resolve_order
                else None
            )}\n"
        )
        for template in templates
    )

    intent_title = (
        intent.code.get(language)
        or intent.code.get("en")
        or intent_code
    )

    # =========================================================
    # 5. Выбор одного Template
    # =========================================================

    selected_template = templates[0]

    render_pattern = selected_template.code[language].strip()

    resolve_pattern = render_pattern

    if selected_template.resolve_order:
        language_resolve_order = (
            selected_template.resolve_order.get(language)
        )

        if (
            isinstance(language_resolve_order, str)
            and language_resolve_order.strip()
        ):
            resolve_pattern = language_resolve_order.strip()

    render_order = render_pattern.split()
    resolve_order = resolve_pattern.split()


    render_order_text = ", ".join(render_order)
    resolve_order_text = ", ".join(resolve_order)

    # =========================================================
    # 6. Загрузка пулов ChunkCandidate
    # =========================================================

    candidate_pools = await get_candidate_pools(
        session=session,
        block_codes=resolve_order,
        language=language,
        level=level,
    )

    candidate_counts = {
        block_code: len(candidates)
        for block_code, candidates in candidate_pools.items()
    }

    missing_block_codes = [
        block_code
        for block_code, candidates in candidate_pools.items()
        if not candidates
    ]
    candidate_counts_text = "\n".join(
        f"  {block_code}: {count}"
        for block_code, count in candidate_counts.items()
    )

    missing_blocks_text = (
        ", ".join(missing_block_codes)
        if missing_block_codes
        else "none"
    )
    print(
        "ENGINE DIAGNOSTICS:",
        {
            "language": language,
            "level": level,
            "intent_code": intent_code,
            "intent_id": intent.id,
            "tense": tense,
            "strategy_ids": strategy_ids,
            "templates_before_language": len(
                templates_before_language
            ),
            "templates_after_language": len(templates),
            "template_ids": [
                template.id
                for template in templates
            ],
            "selected_template_id": selected_template.id,
            "render_pattern": render_pattern,
            "resolve_pattern": resolve_pattern,
            "render_order": render_order,
            "resolve_order": resolve_order,

            "candidate_counts": candidate_counts,
            "missing_block_codes": missing_block_codes,

        },
    )

    return (
        f"Intent:\n"
        f"  id={intent.id}\n"
        f"  code={intent_code}\n"
        f"  title={intent_title}\n"
        f"Level: {level}\n"
        f"Strategies:\n{strategies_text}\n"
        f"Selected template:\n"
        f"  id={selected_template.id}\n"
        f"  render_pattern={render_pattern}\n"
        f"  resolve_pattern={resolve_pattern}\n"
        f"  render_order=[{render_order_text}]\n"
        f"  resolve_order=[{resolve_order_text}]\n"
        f"\nCandidate pools:\n"
        f"{candidate_counts_text}\n"
        f"Missing blocks: {missing_blocks_text}"
    )

