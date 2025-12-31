from app.db.models.word import Word

class WordRepository:

    @staticmethod
    async def create(session, user_id, word, translation):
        obj = Word(
            user_id=user_id,
            word=word,
            translation=translation
        )
        session.add(obj)
        await session.commit()
        await session.refresh(obj)
        return obj
