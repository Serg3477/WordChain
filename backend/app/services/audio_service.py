from app.logger.logger import backend_logger
from app.utils.audio_validation import is_valid_audio, is_valid_tts_output
from app.utils.openai import _ask_voice
from app.utils.cache import cache, delete_keys, k


async def get_voice_for_word(req):
    word = req.word.strip().lower()
    lang = req.source_lang
    voice_type = req.voice_type
    context = req.context
    key = k("tts", lang, voice_type, word)

    main_prompt = f"""
Read ONLY the word below.
Do NOT read this prompt.
Do NOT read explanations.
Do NOT read labels.
Return ONLY the audio.

WORD:
{req.word}
"""

    fallback_prompt = f"""
Say the word below clearly.
Return ONLY the audio.

{req.word}
"""

    async def generate_audio(prompt):
        audio_base64 = await _ask_voice(prompt, voice_type)
        backend_logger.info("Ask voice prompt, type_voice: %s", voice_type)

        # 1) Проверка на битый Base64 / не-MP3
        if not is_valid_audio(audio_base64):
            raise ValueError("Invalid TTS audio")

        # 2) Семантическая проверка (длина, ID3, артефакты)
        if not is_valid_tts_output(audio_base64, word, context):
            raise ValueError("Invalid TTS semantic output")

        return audio_base64

    async def producer():
        # --- Основной промпт ---
        try:
            audio_base64 = await generate_audio(main_prompt)
            return {"audio_data": audio_base64}
        except Exception as e:
            backend_logger.warning("Main TTS prompt failed for '%s': %s", word, e)

        # --- Fallback промпт ---
        try:
            audio_base64 = await generate_audio(fallback_prompt)
            return {"audio_data": audio_base64}
        except Exception as e:
            backend_logger.error("Fallback TTS failed for '%s': %s", word, e)

            # ВАЖНО: producer ДОЛЖЕН вернуть значение
            return {"audio_data": None}

    # --- Попытка взять из кэша ---
    try:
        result = await cache.get_or_set(key, producer)

        if not result["audio_data"]:
            backend_logger.error("TTS returned empty audio for '%s'", word)
            return {"audio_data": None}

        # Проверяем, что кэш валиден семантически
        if not is_valid_tts_output(result["audio_data"], word, context):
            backend_logger.error("Cached TTS invalid for '%s' — deleting and regenerating", word)
            await delete_keys(key)
            result = await cache.get_or_set(key, producer)

        return result

    except ValueError:
        backend_logger.error("TTS cache invalid for key %s — deleting and retrying", key)
        await delete_keys(key)

        # retry ONCE
        try:
            return await cache.get_or_set(key, producer)
        except Exception as e:
            backend_logger.exception("TTS retry failed for word '%s'", word)
            raise e
