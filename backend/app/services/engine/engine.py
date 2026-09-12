from typing import Any

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
from app.services.engine.simple_candidate_builder import (
    CandidateSelectionError,
    build_sentence,
)



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
) -> dict[str, Any]:
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
    # 6–7. Выбор собираемого Template и сборка предложения
    #
    # Отсутствующие кандидаты у одного шаблона не должны останавливать
    # движок: пробуем следующий Template из уже отфильтрованного списка.
    # =========================================================

    built_sentence = None
    template_failures = []

    for template in templates:
        try:
            built_sentence = await build_sentence(
                session=session,
                template=template,
                language=language,
                level=level,
                tense=tense,
            )
            break
        except CandidateSelectionError as exc:
            template_failures.append(
                {
                    "template_id": template.id,
                    "code": exc.code,
                    "message": str(exc),
                    **exc.details,
                }
            )

    if built_sentence is None:
        raise HTTPException(
            status_code=422,
            detail={
                "code": "RESOLUTION_FAILED",
                "message": "No template could be assembled",
                "language": language,
                "level": level,
                "tense": tense,
                "template_failures": template_failures,
            },
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
            "templates_before_language": len(templates_before_language),
            "templates_after_language": len(templates),
            "selected_template_id": built_sentence.template_id,
            "skipped_templates": template_failures,
            "selected_blocks": [
                {
                    "position": block.position,
                    "block_code": block.block_code,
                    "candidate_id": block.candidate_id,
                    "text": block.text,
                }
                for block in built_sentence.selected_blocks
            ],
        },
    )

    return {
        "sentence": built_sentence.sentence,
        "template": {
            "id": built_sentence.template_id,
            "key": built_sentence.template_key,
            "render_order": built_sentence.render_order,
            "resolve_order": built_sentence.resolve_order,
        },
        "blocks": [
            {
                "position": block.position,
                "block_code": block.block_code,
                "candidate_id": block.candidate_id,
                "text": block.text,
            }
            for block in built_sentence.selected_blocks
        ],
    }
