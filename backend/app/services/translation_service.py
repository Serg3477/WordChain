from openai import OpenAI
import json
from redis.asyncio import Redis
from app.db.config import settings
from fastapi import HTTPException


client = OpenAI(api_key=settings.OPENAI_API_KEY)

redis = Redis.from_url("redis://localhost:6379", decode_responses=True)


async def translate_word(word: str, source_lang: str, target_lang: str):
    print("DEBUG:", word, source_lang, target_lang)
    if not source_lang:
        source_lang = "auto"

    if not target_lang:
        raise HTTPException(400, "Target language is required")

    if not word.strip():
        raise HTTPException(400, "Word cannot be empty")

    # Кэш
    cache_key = f"translate:{word}:{source_lang}:{target_lang}"
    cached = await redis.get(cache_key)
    if cached:
        return json.loads(cached)

    # Формируем запрос
    prompt = (
        f"Translate the word '{word}' from {source_lang} to {target_lang}. "
        f"Provide parts of speech, and 7 example sentences using the {source_lang}."
        f"Return ONLY valid JSON. No explanations. No extra text. "
        f"Do NOT use markdown. Do NOT wrap the JSON in ```json or any other formatting."
        f"JSON format:\n"
        f'{{"translation": "...", "part_of_speech": "...", "examples": ["string", ..."]}}'
    )

    # ❗ ВАЖНО: без await
    response = client.responses.create(
        model="gpt-4o-mini",
        input=prompt,
        max_output_tokens = 120
    )

    # Забираем текст
    text = response.output_text

    print("RAW RESPONSE:", response)
    print("OUTPUT TEXT:", response.output_text)

    # Парсим JSON
    result = json.loads(text)

    # Разбираем JSON
    translation = result.get("translation")
    part_of_speech = result.get("part_of_speech")
    examples = result.get("examples", [])


    # Кэшируем
    await redis.set(cache_key, json.dumps(result), ex=60 * 60 * 24 * 30)

    # Возвращаем в том виде, как ждёт роутер
    return {
        "translation": translation,
        "part_of_speech": part_of_speech,
        "examples": examples
    }





# async def translate_word(word: str, source_lang: str, target_lang: str):
#     print("DEBUG:", word, source_lang, target_lang)
#     if not source_lang:
#         source_lang = "auto"
#
#     if not target_lang:
#         raise HTTPException(400, "Target language is required")
#
#     if not word.strip():
#         raise HTTPException(400, "Word cannot be empty")
#
#     # Кэш
#     cache_key = f"translate:{word}:{source_lang}:{target_lang}"
#     cached = await redis.get(cache_key)
#     if cached:
#         return json.loads(cached)
#
#         # Формируем запрос
#     prompt = (
#         f"Translate the word '{word}' from {source_lang} to {target_lang}. "
#         f"Return ONLY valid JSON with fields: "
#         f"translation, part_of_speech, transcription, examples. "
#         f"Examples must be a list of 7 short sentences."
#     )
#
#     # запускаем streaming
#     stream = await client.responses.create(
#         model="gpt-4o-mini",
#         input=prompt,
#         max_output_tokens=120,
#         temperature=0.2,
#         stream=True
#     )
#
#     collected_text = ""
#
#     # читаем поток частями
#     async for event in stream:
#         if event.type == "response.output_text.delta":
#             collected_text += event.delta
#
#     # пытаемся распарсить JSON
#     try:
#         data = json.loads(collected_text)
#     except json.JSONDecodeError:
#         data = {
#             "translation": "",
#             "part_of_speech": "",
#             "transcription": "",
#             "examples": []
#         }
#     # Кэшируем
#     await redis.set(cache_key, json.dumps(data), ex=60 * 60 * 24 * 30)
#
#     return data

# async def translate_word(word: str, source_lang: str, target_lang: str):
#     if not source_lang:
#         source_lang = "auto"
#
#     if not target_lang:
#         raise HTTPException(400, "Target language is required")
#
#     if not word.strip():
#         raise HTTPException(400, "Word cannot be empty")
#
#     cache_key = f"translate:{word}:{source_lang}:{target_lang}"
#     cached = await redis.get(cache_key)
#     if cached:
#         return json.loads(cached)
#
#     prompt = (
#         f"Translate the word '{word}' from {source_lang} to {target_lang}. "
#         f"Return ONLY valid JSON with fields: "
#         f"translation, part_of_speech, transcription, examples. "
#         f"Examples must be a list of 7 short sentences."
#     )
#
#     response = await client.responses.create(
#         model="gpt-4o-mini",
#         input=prompt,
#         max_output_tokens=120,
#         temperature=0.2
#     )
#
#     text = response.output_text
#
#     try:
#         data = json.loads(text)
#     except:
#         data = {
#             "translation": "",
#             "part_of_speech": "",
#             "transcription": "",
#             "examples": []
#         }
#
#     await redis.set(cache_key, json.dumps(data), ex=60 * 60 * 24 * 30)
#
#     return data
