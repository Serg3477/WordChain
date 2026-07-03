import base64


def is_valid_audio(b64: str) -> bool:
    if not b64 or not isinstance(b64, str):
        return False

    try:
        raw = base64.b64decode(b64, validate=True)
    except Exception:
        return False

    # MPEG audio frame sync: 1111 1111 111 (0xFFE0 mask)
    if raw.startswith(b"ID3"):
        return True

    if len(raw) >= 2 and (raw[0] == 0xFF and (raw[1] & 0xE0) == 0xE0):
        return True

    return False



def is_valid_tts_output(b64: str, expected_word: str, context) -> bool:
    if not b64 or not isinstance(b64, str):
        return False

    try:
        raw = base64.b64decode(b64, validate=True)
    except Exception:
        return False

    # 1) Проверка MP3 заголовка
    if not is_valid_audio(b64):
        return False

    # 2) Проверка длины (реалистично)
    # ---------------------------
    # Лимиты по контексту
    # ---------------------------
    size = len(raw)

    if context == "word":
        if size > 120_000:  # 120 KB — слово точно не больше
            return False

    elif context == "sentence":
        if size > 300_000:  # 300 KB — предложение точно не больше
            return False

    elif context == "text":
        if size > 1200_000:  # 800 KB — нормальный лимит для текста
            return False

    else:
        # fallback — если контекст неизвестен
        if size > 300_000:
             return False

    # 3) Проверка на текстовые артефакты (только в ID3)
    header = raw[:5000]  # ID3-теги обычно в первых 5 KB
    forbidden = [b"ChatGPT prompt", b"full prompt", b"Return ONLY the audio"]
    if any(x in header for x in forbidden):
        return False

    return True


