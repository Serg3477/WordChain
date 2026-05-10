from app.db.models.set_word import SetWord

class SetWordRepository:

    @staticmethod
    async def add_word_to_set(session, set_id: int, word_id: int):
        """
        Добавляет слово в сет (создаёт запись в set_words).
        """
        obj = SetWord(
            set_id=set_id,
            word_id=word_id
        )
        session.add(obj)
        await session.commit()
        await session.refresh(obj)
        return obj

    @staticmethod
    async def remove_word_from_set(session, set_id: int, word_id: int):
        """
        Удаляет слово из сета.
        """
        result = await session.execute(
            SetWord.__table__.delete().where(
                (SetWord.set_id == set_id) &
                (SetWord.word_id == word_id)
            )
        )
        await session.commit()
        return result.rowcount  # сколько строк удалено

    @staticmethod
    async def get_words_for_set(session, set_id: int):
        """
        Возвращает список записей SetWord для сета.
        """
        result = await session.execute(
            SetWord.__table__.select().where(SetWord.set_id == set_id)
        )
        return result.fetchall()
