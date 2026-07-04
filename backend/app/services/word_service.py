import asyncio
import json
import re
from typing import List, Optional
from fastapi import HTTPException
from sqlalchemy import select, func

from app.db.models.word import Word
from app.db.models.set import Set
from app.utils.openai import _ask_text
from app.schemas.word import TranslationJSON, WordUpdateByIdRequest
from app.utils.word_unrepeat_cache import generate_any_word
from app.utils.cache import _get_cached_json, get_full_cached, cache, TTL_PARTS, set_full_cache, TTL_FULL
from app.utils.cache import delete_keys, collect_translation_keys
from app.logger.logger import backend_logger
from app.db.models.set_word import SetWord
from app.db.repositories.set_word_repository import SetWordRepository
from app.schemas.word import WordDeleteRequest
from app.schemas.word import WordMoveRequest
from app.utils.word_helpers import _normalize_word, _normalize_lang, to_list



# -----------------------------
# Main translation function
# -----------------------------
async def translate_word(word: str, source_lang: str, target_lang: str):
    if not target_lang:
        raise HTTPException(400, "Target language is required")
    if not (word or "").strip():
        raise HTTPException(400, "Word cannot be empty")

    src = _normalize_lang(source_lang, default="auto")
    tgt = _normalize_lang(target_lang, default="ru")
    norm_word = _normalize_word(word)

    # -----------------------------
    # 1. FULL RESULT CACHE
    # -----------------------------

    base_key = f"translate:v2:{src}:{tgt}:{norm_word}"
    full_key = f"{base_key}:full"

    # full cache
    full_cached = await get_full_cached(full_key)
    if full_cached:
        return full_cached

    # ---------------------------------
    # 2. PRODUCERS OF FIRST TRANSLATION
    # ---------------------------------
    async def produce_correctness():
        prompt = (
            f"Check the spelling of the '{norm_word}' in {src}. "
            f"Return only the corrected word, or '{norm_word}' if already correct. No explanations."
        )
        return await _ask_text(prompt, max_tokens=20)

    async def produce_translation():
        prompt = (
            f"Make several possible translations (max 6, comma-separated) of '{norm_word}' "
            f"from {src} to {tgt}. Return only translations, no explanations."
        )
        return await _ask_text(prompt, max_tokens=50)

    async def produce_transcription():
        prompt = (
            f"Provide IPA transcription for '{norm_word}' in {src}. "
            f"Return only transcription, no slashes, no explanations."
        )
        return await _ask_text(prompt, max_tokens=20)

    async def produce_part_of_speech():
        prompt = (
            f"Determine part of speech and return only short value like noun/verb/adjective/etc  for '{norm_word}' in {src}. "
        )
        return await _ask_text(prompt, max_tokens=20)

    # -----------------------------
    # REDIS. FIRST: CORRECTNESS
    # -----------------------------
    correctness_key = f"{base_key}:v2:correctness"
    correctness = await cache.get_or_set(
        correctness_key,
        produce_correctness,
        ttl=TTL_PARTS
    )

    # If corrected → update norm_word and rebuild keys
    if correctness and correctness != norm_word:
        norm_word = correctness.strip()
        base_key = f"translate:v2:{src}:{tgt}:{norm_word}"
        full_key = f"{base_key}:full"

    # -----------------------------
    # REDIS. KEYS FOR OTHER PARTS
    # -----------------------------
    translation_key = f"{base_key}:translation"
    transcription_key = f"{base_key}:transcription"
    pos_key = f"{base_key}:part_of_speech"

    # -----------------------------
    # REDIS. PARALLEL FETCH (ATOMIC)
    # -----------------------------
    translation, transcription, part_of_speech = await asyncio.gather(
        _get_cached_json(translation_key, produce_translation, TTL_PARTS),
        _get_cached_json(transcription_key, produce_transcription, TTL_PARTS),
        _get_cached_json(pos_key, produce_part_of_speech, TTL_PARTS),
    )

    # -----------------------------
    # FINAL RESULT
    # -----------------------------
    result = {
        "word": correctness or "",
        "translation": translation or "",
        "transcription": transcription or "",
        "part_of_speech": part_of_speech or "",
    }
    await set_full_cache(full_key, result, TTL_FULL)
    return result


# -----------------------------
# Get Any Word function
# -----------------------------
async def get_any_word(req):
    if not req:
        raise HTTPException(400, "Source language is required")
    return await generate_any_word(source_lang=req)



# ---------------------------------
# Get Certain Word from db function
# ---------------------------------
async def word_read(session, id: int, user_id: int) -> Word:
    stmt = (
        select(Word)
        .where(Word.id == id, Word.user_id == user_id)
        .order_by(Word.id.desc())
        .limit(1)
    )
    result = await session.execute(stmt)
    backend_logger.info(f"Reading word from the base: {stmt}")
    return result.scalar_one_or_none()

# ---------------------------------
# Update Word into db function
# ---------------------------------
# TODO: оптимизировать: не делать лишний запрос на чтение, а сразу пытаться обновить нужные поля через UPDATE и вернуть результат. Но для этого нужно будет вручную замержить translation_json, а это чуть сложнее, чем просто перезаписать. Поэтому пока так, а дальше можно будет оптимизировать.
async def word_update(session, req: WordUpdateByIdRequest):
    w = None
    stmt = select(Word).where(
        Word.id == req.id,
        Word.user_id == req.user_id
    )
    backend_logger.info(f"word_update stmt: {stmt}")

    res = await session.execute(stmt)
    w = res.scalar_one_or_none()
    if not w:
        raise HTTPException(404, "Not found")

    # merge simple fields
    if getattr(req, "translation", None) is not None:
        w.translation = req.translation
    if getattr(req, "transcription", None) is not None:
        w.transcription = req.transcription
    if getattr(req, "part_of_speech", None) is not None:
        w.part_of_speech = req.part_of_speech

        # merge translation_json: shallow merge for keys
    if getattr(req, "translation_json", None) is not None:
        incoming = req.translation_json.model_dump() if hasattr(req.translation_json, "model_dump") else dict(
            req.translation_json)
        existing = w.translation_json or {}
        merged = {**existing, **{k: v for k, v in incoming.items() if v not in (None, [], "-")}}
        w.translation_json = merged

        # массивы: заменяем если пришли
    if getattr(req, "examples", None) is not None:
        w.examples = req.examples
    if getattr(req, "synonyms", None) is not None:
        w.synonyms = req.synonyms
    if getattr(req, "antonyms", None) is not None:
        w.antonyms = req.antonyms

    await session.commit()
    await session.refresh(w)
    # invalidate caches
    try:
        # если у вас поддержка только auto->ru, можно вызвать так:
        keys = collect_translation_keys(w.word, srcs=("auto",), tgts=("ru",))
        await delete_keys(*keys)
    except Exception:
        backend_logger.exception("Failed to invalidate cache for %s", w.word)

    return w


async def word_delete(session, req: WordDeleteRequest):
    # 1. Найти слово (как word_read)
    w = await word_read(session, req.id, req.user_id)
    if not w:
        return None
    # 2. Опционально: сверить текст слова с запросом
    if req.word and w.word != req.word:
        backend_logger.warning(
            f"word_delete: text mismatch id={req.id}, db={w.word}, req={req.word}"
        )
    word_text = w.word
    # 3. Сохранить данные для ответа до удаления
    deleted_data = {
        "id": w.id,
        "word": word_text,
        "translation": w.translation,
        "translation_json": w.translation_json,
        "part_of_speech": w.part_of_speech,
        "transcription": w.transcription,
        "examples": w.examples or [],
        "synonyms": w.synonyms or [],
        "antonyms": w.antonyms or [],
        "created_at": w.created_at,
        "updated_at": w.updated_at,
    }
    # 4. set_words → words → пустые сеты
    affected_set_ids = list(
        (await session.scalars(select(SetWord.set_id).where(SetWord.word_id == w.id))).all()
    )
    await SetWordRepository.remove_word_from_all_sets(session, w.id)
    await session.delete(w)

    for set_id in affected_set_ids:
        remaining = await session.scalar(
            select(func.count()).select_from(SetWord).where(SetWord.set_id == set_id)
        )
        if remaining == 0:
            set_obj = await session.scalar(
                select(Set).where(Set.id == set_id, Set.user_id == req.user_id)
            )
            if set_obj:
                await session.delete(set_obj)
                backend_logger.info(f"[SET] Deleted empty set id={set_id} for user {req.user_id}")

    await session.commit()
    # 5. Инвалидация кэша (как в word_update)
    try:
        keys = collect_translation_keys(word_text, srcs=("auto",), tgts=("ru",))
        await delete_keys(*keys)
    except Exception:
        backend_logger.exception("Failed to invalidate cache for %s", word_text)
    return deleted_data


async def word_move(session, req: WordMoveRequest):
    # 1. Найти слово (как word_read)
    w = await word_read(session, req.id, req.user_id)
    if not w:
        return None
    # 2. Опционально: сверить текст слова с запросом
    if req.word and w.word != req.word:
        backend_logger.warning(
            f"word_delete: text mismatch id={req.id}, db={w.word}, req={req.word}"
        )
    word_text = w.word
    # 3. Сохранить данные для ответа до удаления
    removed_data = {
        "id": w.id,
        "word": word_text,
        "translation": w.translation,
        "translation_json": w.translation_json,
        "part_of_speech": w.part_of_speech,
        "transcription": w.transcription,
        "examples": w.examples or [],
        "synonyms": w.synonyms or [],
        "antonyms": w.antonyms or [],
        "created_at": w.created_at,
        "updated_at": w.updated_at,
    }
    # 4. сохранить слово в новом сете (если задан)
    if req.new_set is not None:
        await SetWordRepository.add_word_to_set(
            session=session,
            set_id=req.new_set,
            word_id=req.id
        )
    # 5. удалить слово из старого сета (если задан)
    if req.old_set is not None:
        await SetWordRepository.remove_word_from_set(
            session=session,
            set_id=req.old_set,
            word_id=req.id
        )
        # если старый сет опустел — удалить его (как в word_delete)
        remaining = await session.scalar(
            select(func.count()).select_from(SetWord).where(SetWord.set_id == req.old_set)
        )
        if remaining == 0:
            set_obj = await session.scalar(
                select(Set).where(Set.id == req.old_set, Set.user_id == req.user_id)
            )
            if set_obj:
                await session.delete(set_obj)
                backend_logger.info(f"[SET] Deleted empty set id={req.old_set} for user {req.user_id}")

    await session.commit()
    # 5. Инвалидация кэша (как в word_update)
    try:
        keys = collect_translation_keys(word_text, srcs=("auto",), tgts=("ru",))
        await delete_keys(*keys)
    except Exception:
        backend_logger.exception("Failed to invalidate cache for %s", word_text)
    return removed_data

# ---------------------------------
# Get Better Translation of Word function
# ---------------------------------
async def word_better_translation(word: str, src: str, tgt: str):
    """
    Возвращает структурированный перевод (TranslationJSON) для word (src->tgt).
    Результат кешируется в Redis через AtomicCache.
    """
    norm_word = _normalize_word(word)
    src = _normalize_lang(src, default="auto")
    tgt = _normalize_lang(tgt, default="ru")

    base_key = f"translate:v2:{src}:{tgt}:{norm_word}"
    better_key = f"{base_key}:better_translation"

    async def produce_better():
        example = {
            "definite_translation": ["костюм, иск", "подходить, соответствовать"],
            "plural": "suits",
            "verb_forms": ["suit", "suited", "suited", "suiting"],
            "passive_form": "be suited",
            "phrasal_verbs": ["suit up - надевать костюм"]
        }

        prompt = (
            "System: Return only valid JSON and nothing else.\n\n"
            f"User: For the word \"{norm_word}\" from {src} to {tgt} return a JSON object with keys:\n"
            "- \"definite_translation\": array up to 2 strings [noun_translation, verb_translation] or [];\n"
            "- \"plural\": string or \"-\";\n"
            "- \"verb_forms\": array of strings or [];\n"
            "- \"passive_form\": string or \"-\";\n"
            "- \"phrasal_verbs\": array of strings in format \"phrasal - translation\" or [].\n\n"
            "If a field is not applicable, return an empty array or \"-\".\n"
            "Example: " + json.dumps(example, ensure_ascii=False)
        )

        raw = await _ask_text(prompt, max_tokens=400)
        backend_logger.debug("Raw better_translation response for %s: %s", norm_word, raw)

        # Попытка строгого парсинга JSON
        parsed = None
        try:
            parsed = json.loads(raw)

        except Exception:
            # Попытка извлечь JSON-подстроку
            try:
                start = raw.index("{")
                end = raw.rindex("}") + 1
                parsed = json.loads(raw[start:end])
            except Exception:
                parsed = None

        if parsed is not None:
            return parsed

        parts = [p.strip() for p in re.split(r"\||\n", raw) if p.strip()]
        fallback = {
            "definite_translation": [],
            "plural": "-",
            "verb_forms": [],
            "passive_form": "-",
            "phrasal_verbs": []
        }

        for p in parts:
            low = p.lower()
            if "множествен" in low or "plural" in low:
                val = re.split(r"[-:]", p, maxsplit=1)[-1].strip()
                fallback["plural"] = val
            elif "форм" in low or "verb forms" in low:
                val = re.split(r"[-:]", p, maxsplit=1)[-1].strip()
                fallback["verb_forms"] = to_list(val)
            elif "пассив" in low or "passive" in low:
                val = re.split(r"[-:]", p, maxsplit=1)[-1].strip()
                fallback["passive_form"] = val
            elif "-" in p and len(p.split("-")[0].split()) <= 4:
                fallback["phrasal_verbs"].append(p)
            else:
                if not fallback["definite_translation"]:
                    fallback["definite_translation"].append(p)
                elif len(fallback["definite_translation"]) == 1:
                    fallback["definite_translation"].append(p)

        return fallback

    cached_obj = await _get_cached_json(better_key, produce_better, ttl=TTL_PARTS)

    # Валидация через Pydantic. Если кеш повреждён — удаляем ключ и пересоздаём.
    try:
        translation_json = TranslationJSON.model_validate(cached_obj)
    except Exception:
        backend_logger.exception("Better translation cache validation failed for %s, invalidating key", norm_word)
        try:
            await delete_keys(better_key)
        except Exception:
            backend_logger.exception("Failed to delete corrupted better_translation cache for %s", norm_word)
        # повторный запрос напрямую (без кеша)
        parsed = await produce_better()
        translation_json = TranslationJSON.model_validate(parsed)

    backend_logger.info("Made better translation attempt for %s: %s", norm_word, translation_json)
    return translation_json




# -------------------------------------------
# Get Synonyms of the Word function
# -------------------------------------------
async def word_synonyms(word: str) -> List[str]:
    key = f"translate:v2:meta:{_normalize_word(word)}:synonyms"

    async def produce():
        prompt = (
            f"Provide up to 12 synonyms for the word '{word}' in the same language."
            f"Return them as a single comma-separated line, nothing else — no explanations, no numbering, no JSON."
            f"Each item should be a single word or short phrase (no internal commas)."
            f"If there are no synonyms, return an empty line."
            f"Example output: capture, grab, snatch, take, appropriate."
        )
        raw = await _ask_text(prompt, max_tokens=50)
        return to_list(raw)

    return await _get_cached_json(key, produce, ttl=TTL_PARTS)

# -------------------------------------------
# Get Antonyms of the Word function
# -------------------------------------------
async def word_antonyms(word: str) -> List[str]:
    key = f"translate:v2:meta:{_normalize_word(word)}:antonyms"

    async def produce():
        prompt = (
            f"Provide up to 12 antonyms for the word '{word}' in the same language."
            f"Return them as a single comma-separated line, nothing else — no explanations, no numbering, no JSON."
            f"Each item should be a single word or short phrase (no internal commas)."
            f"If there are no antonyms, return an empty line."
            f"Example output: release, let go, free, relinquish"
        )
        raw = await _ask_text(prompt, max_tokens=50)
        return to_list(raw)

    return await _get_cached_json(key, produce, ttl=TTL_PARTS)

# -------------------------------------------
# Get Sentences with the Word function
# -------------------------------------------
async def word_sentences(word: str, examples_count: int) -> List[str]:
    key = f"translate:v2:meta:{_normalize_word(word)}:sentences"

    async def produce():
        prompt = (
            f"Generate exactly {examples_count} example sentences that use the word {word} in the same language."
            f"Return a JSON object with a single key 'examples' whose value is an array of strings."
            f"Requirements:"
            f"- Return only the JSON object, no explanations, no extra text."
            f"- Include at least one question and at least one passive sentence."
            f"- Use a variety of tenses and forms: present simple, present continuous, past simple, future simple, present perfect, passive, question."
            f"- Sentences should be natural and not overly simple; length ~6–20 words."
            f"- Avoid extra commentary or labels."
            f"Example:"
            f"'examples': ["
            f"'He seized the opportunity and moved to London.',"
            f"'Will you seize the chance when it appears?',"
            f"'The package was seized by customs yesterday.',"
            f"'She seizes every moment to practice her piano.',"
            f"'By next year he will have seized control of the project.',"
            f"'They have seized the assets after the investigation.'"
        )
        raw = await _ask_text(prompt, max_tokens=200)
        try:
            data = json.loads(raw)
            return data.get("examples", [])
        except Exception:
            # если модель вернула нестрогий JSON — попробуем извлечь JSON-подстроку
            try:
                start = raw.index("{")
                end = raw.rindex("}") + 1
                maybe_json = raw[start:end]
                data = json.loads(maybe_json)
                return data.get("examples", [])
            except Exception:
                # fallback: разбить по строкам/разделителям
                parts = [p.strip() for p in re.split(r"\||\n", raw) if p.strip()]
                # берем первые 6 подходящих строк
                return parts[:6]

    return await _get_cached_json(key, produce, ttl=TTL_PARTS)






