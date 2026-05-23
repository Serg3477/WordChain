import asyncio
import json
import re
import unicodedata
from typing import List, Optional

from fastapi import HTTPException
from openai import AsyncOpenAI
from redis.asyncio import Redis
from sqlalchemy import select

from app.db.models.word import Word
from app.db.config import settings
from app.utils.atomic_cache import AtomicCache
from app.utils.word_unrepeat_cache import generate_any_word


client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

redis = Redis.from_url("redis://localhost:6379", decode_responses=True)      # Dev-mode (desktop)
# redis = Redis.from_url("redis://redis:6379", decode_responses=True)        # Docker-mode

MODEL = "gpt-5.4-mini"
TTL_FULL = 60 * 60 * 24 * 30
TTL_PARTS = 60 * 60 * 24 * 30

cache = AtomicCache(redis, default_ttl=TTL_PARTS)


# -----------------------------
# Normalization helpers
# -----------------------------
def _normalize_word(word: str) -> str:
    value = unicodedata.normalize("NFKC", word or "")
    value = value.strip().lower()
    value = re.sub(r"\s+", " ", value)
    value = value.rstrip("!?.,;:")
    return value


def _normalize_lang(lang: str, default: str = "auto") -> str:
    aliases = {
        "eng": "en",
        "english": "en",
        "ru-ru": "ru",
        "рус": "ru",
    }
    value = (lang or "").strip().lower()
    if not value:
        return default
    return aliases.get(value, value)


def to_list(value: Optional[str]) -> List[str]:
    """
    Нормализует вход (строка с запятыми, список или None) в List[str].
    - None -> []
    - list -> [stripped items]
    - "a, b, c" -> ["a", "b", "c"]
    - "a\nb" -> ["a", "b"]
    """
    if value is None:
        return []
    if isinstance(value, list):
        return [str(x).strip() for x in value if str(x).strip()]
    if isinstance(value, str):
        # поддерживаем как запятые, так и переносы строк
        if "\n" in value and "," not in value:
            parts = [s.strip() for s in value.splitlines() if s.strip()]
        else:
            parts = [s.strip() for s in value.split(",") if s.strip()]
        return parts
    # на всякий случай
    return [str(value).strip()]


# -----------------------------
# OpenAI wrapper
# -----------------------------
async def _ask_text(prompt: str, max_tokens: int = 60) -> str:
    resp = await client.responses.create(
        model=settings.MODEL,
        input=prompt,
        max_output_tokens=max_tokens,
    )
    return (resp.output_text or "").strip()


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

    full_cached = await redis.get(full_key)
    if full_cached:
        return json.loads(full_cached)

    # -----------------------------
    # 2. PRODUCERS
    # -----------------------------
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
        cache.get_or_set(translation_key, produce_translation, TTL_PARTS),
        cache.get_or_set(transcription_key, produce_transcription, TTL_PARTS),
        cache.get_or_set(pos_key, produce_part_of_speech, TTL_PARTS),
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
    await redis.set(full_key, json.dumps(result, ensure_ascii=False), ex=TTL_FULL)
    return result


# -----------------------------
# Get Any Word function
# -----------------------------
async def get_any_word(req):
    if not req:
        raise HTTPException(400, "Source language is required")
    return await generate_any_word(
        source_lang=req,
        redis=redis,
        client=client,
        model=MODEL,
    )


# ---------------------------------
# Get Certain Word from db function
# ---------------------------------
async def word_read(session, word: str, user_id: int) -> Word:
    stmt = select(Word).where(
        Word.user_id == user_id,
        Word.word == word
    )
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


# -------------------------------------------
# Get Better Translation of the Word function
# -------------------------------------------
async def word_better_translation(word: str, src: str, tgt: str) -> str:
    if not tgt:
        raise HTTPException(400, "Target language is required")
    if not (word or "").strip():
        raise HTTPException(400, "Word cannot be empty")

    prompt = (
        f"Provide an expanded translation and morphological summary for the word {word} from {src} to {tgt} as one single string."
        f"Use the pipe character '|' to mark line breaks (each '|' means a new line). Do not return JSON, HTML, lists, or any extra commentary — only one string." 
        f"The string must contain the following labeled sections in this order, separated by ' | ':"
        f"1. **Part of speech** — short label (noun, verb, adj, adv, etc.) and brief gloss in {tgt}."
        f"2. **Primary translations (max 16, comma-separated)** — core translations in {tgt}."
        f"3. **Plural / comparative / superlative / other inflected forms** — if applicable (e.g., plural for nouns, comparative/superlative for adjectives)."
        f"4. **Verb forms** — base, past, past participle, present participle (if the word can be a verb)."
        f"5. **Passive form** — if applicable (single word or short phrase)."
        f"6. **Phrasal verbs / common collocations** — list up to 6 items with short translations (format: 'phrasal verb - translation')."
        f"7. **Usage notes** — register, typical contexts, false friends, common confusions (one short sentence)."
        f"8. **Example sentences (up to 3)** — each example separated by ';' (use {tgt} translation if requested, otherwise keep examples in English)."
        f"9. **Related words / short synonyms (up to 6)** — comma-separated."

        f"Requirements:"
        f"- Each section must be present in the string, even if empty (use '-' for empty)."
        f"- Do not include extra punctuation outside the sections; use commas only inside lists."
        f"- Keep the entire returned string under 800 characters if possible."
        f"- Replace `{word}`, `{src}`, `{tgt}` with actual values before sending."

        f"Example (for word 'prove', English→Russian):"
        f"Part of speech - verb"
        f"Primary translations - доказывать, подтверждать, устанавливать"
        f"Inflected forms - - | Verb forms - prove, proved, proven, proving"
        f"Passive form - be proven / proven"
        f"Phrasal verbs:"
        f" - prove out - подтвердиться;"
        f" - prove to be - оказаться; "
        f" - prove up - подтвердить (в контексте)"
        f"Usage notes - formal and neutral; often used in legal/scientific contexts"
        f"Examples - He proved his theory in the paper; The claim was proven false; She proved to be reliable"
        f"Related words - demonstrate, verify, confirm"
    )
    translation = await _ask_text(prompt, max_tokens=300)
    return translation.strip()


# -------------------------------------------
# Get Synonyms of the Word function
# -------------------------------------------
async def word_synonyms(word: str) -> List[str]:
    prompt = (
        f"Provide up to 12 synonyms for the word '{word}' in the same language."
        f"Return them as a single comma-separated line, nothing else — no explanations, no numbering, no JSON."
        f"Each item should be a single word or short phrase (no internal commas)."
        f"If there are no synonyms, return an empty line."
        f"Example output: capture, grab, snatch, take, appropriate."
    )
    synonyms = await _ask_text(prompt, max_tokens=50)
    return to_list(synonyms)


# -------------------------------------------
# Get Antonyms of the Word function
# -------------------------------------------
async def word_antonyms(word: str) -> List[str]:
    prompt = (
        f"Provide up to 12 antonyms for the word '{word}' in the same language."
        f"Return them as a single comma-separated line, nothing else — no explanations, no numbering, no JSON."
        f"Each item should be a single word or short phrase (no internal commas)."
        f"If there are no antonyms, return an empty line."
        f"Example output: release, let go, free, relinquish"
    )
    antonyms = await _ask_text(prompt, max_tokens=50)
    return to_list(antonyms)


# -------------------------------------------
# Get Sentences with the Word function
# -------------------------------------------
async def word_sentences(word: str) -> List[str]:
    prompt = (
        f"Generate exactly 6 example sentences that use the word '{word}' in the same language."
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
    data = await _ask_text(prompt, max_tokens=200)
    sentences = json.loads(data)
    return sentences.get("examples", [])
