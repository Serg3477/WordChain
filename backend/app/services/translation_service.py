from openai import OpenAI
from app.db.config import settings

client = OpenAI(api_key=settings.OPENAI_API_KEY)

async def translate_word(word: str, source_lang: str, target_lang: str):
    prompt = {
        "instruction": "Translate the word and return ONLY valid JSON.",
        "word": word,
        "source_lang": source_lang,
        "target_lang": target_lang,
        "format": {
            "translation": "string",
            "part_of_speech": "string",
            "examples": ["string"]
        }
    }

    response = await client.responses.create(
        model="gpt-5.2",
        input=str(prompt)
    )

    return response.output_text.strip()
