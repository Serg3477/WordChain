from app.db.models.word import Word

class WordRepository:
    @staticmethod
    async def create(session, *, user_id: int, word: str, translation: str,
                     part_of_speech: str, transcription: str,
                     examples: list | None = None, synonyms: list | None = None, antonyms: list | None = None):
        examples = examples or []
        synonyms = synonyms or []
        antonyms = antonyms or []

        new = Word(
            user_id=user_id,
            word=word,
            translation=translation,
            part_of_speech=part_of_speech,
            transcription=transcription,
            examples=examples,
            synonyms=synonyms,
            antonyms=antonyms
        )
        session.add(new)
        await session.flush()   # чтобы получить id и поля
        await session.commit()
        await session.refresh(new)
        return new

