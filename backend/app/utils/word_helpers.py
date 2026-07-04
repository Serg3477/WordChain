import re
import unicodedata
from typing import Optional, List


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
        # English
        "eng": "en",
        "english": "en",
        "en-us": "en",
        "en-gb": "en",
        "en_uk": "en",
        "английский": "en",

        # Russian
        "ru-ru": "ru",
        "ru_ru": "ru",
        "рус": "ru",
        "russian": "ru",
        "русский": "ru",

        # Ukrainian
        "uk-ua": "uk",
        "ua": "uk",
        "украинский": "uk",
        "українська": "uk",

        # German
        "de-de": "de",
        "de_de": "de",
        "german": "de",
        "немецкий": "de",

        # French
        "fr-fr": "fr",
        "fr_fr": "fr",
        "french": "fr",
        "французский": "fr",

        # Spanish
        "es-es": "es",
        "es_es": "es",
        "spanish": "es",
        "испанский": "es",

        # Italian
        "it-it": "it",
        "it_it": "it",
        "italian": "it",
        "итальянский": "it",

        # Polish
        "pl-pl": "pl",
        "pl_pl": "pl",
        "polish": "pl",
        "польский": "pl",
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


