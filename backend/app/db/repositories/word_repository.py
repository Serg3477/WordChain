from app.db.models.word import Word

class WordRepository:

    @staticmethod
    async def create(session, user_id, word, translation, part_of_speech, transcription, examples, synonyms):
        obj = Word(
            user_id=user_id,
            word=word,
            translation=translation,
            part_of_speech = part_of_speech,
            transcription = transcription,
            examples = examples,
            synonyms = [],
        )
        session.add(obj)
        await session.commit()
        await session.refresh(obj)
        return obj
