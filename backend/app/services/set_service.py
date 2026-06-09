from sqlalchemy import select, func
from datetime import datetime

from app.db.models import User
from app.db.models import Set
from app.db.repositories.set_repository import SetRepository
from app.db.repositories.set_word_repository import SetWordRepository
from app.db.session import async_session
from app.db.models.word import Word
from app.db.models.set_word import SetWord
from app.logger.logger import backend_logger
from app.schemas.set import SetDeleteRequest

SET_SIZE = 6


async def check_and_create_set(user_id: int):
    """
        Сравнивает все слова пользователя со словами, уже входящими в сеты.
        Разница попадает в unassigned_words.
        Если len(unassigned_words) == SET_SIZE, создается новый сет.
        В любом случае возвращает unassigned_words.
        """
    backend_logger.info(f"[SET] check_and_create_set started for user {user_id}")

    async with async_session() as session:
        all_words_result = await session.execute(
            select(Word.id, Word.word)
            .where(Word.user_id == user_id)
            .order_by(Word.id.asc())
        )
        all_words = all_words_result.all()

        assigned_result = await session.execute(
            select(SetWord.word_id)
            .join(Set, Set.id == SetWord.set_id)
            .where(Set.user_id == user_id)
        )
        assigned_word_ids = {row[0] for row in assigned_result.all()}

        unassigned_words = [
            {"id": word_id, "word": word_text}
            for word_id, word_text in all_words
            if word_id not in assigned_word_ids
        ]

        backend_logger.info(
            f"[SET] User {user_id} unassigned words: {[w['id'] for w in unassigned_words]}"
        )

        if len(unassigned_words) == SET_SIZE:
            await create_set_from_last_words(session, user_id, unassigned_words)
            unassigned_words = []

        backend_logger.info(
            f"[SET] check_and_create_set finished for user {user_id}, "
            f"unassigned: {[w['id'] for w in unassigned_words]}"
        )

        return unassigned_words

async def create_set_from_last_words(session, user_id: int, words: list[dict]):
    """
        Создаёт новый сет из переданного списка words.
        Список должен быть длиной SET_SIZE.
        """
    backend_logger.info(
        f"[SET] create_set_from_last_words for user {user_id}, words: {[w['id'] for w in words]}"
    )

    if len(words) != SET_SIZE:
        backend_logger.info(
            f"[SET] Not enough words for new set: {len(words)}/{SET_SIZE}"
        )
        return None

    last_number = await SetRepository.get_last_set_number(session, user_id)
    next_number = last_number + 1

    name = f"Set-{next_number}"
    description = f"Создан {datetime.now().strftime('%Y-%m-%d %H:%M')}"

    new_set = await SetRepository.create(
        session=session,
        user_id=user_id,
        name=name,
        description=description
    )

    backend_logger.info(f"[SET] Created set {new_set.id} for user {user_id}")

    for word in words:
        await SetWordRepository.add_word_to_set(
            session=session,
            set_id=new_set.id,
            word_id=word["id"]
        )

    backend_logger.info(
        f"[SET] Set {new_set.id} filled with words: {[w['id'] for w in words]}"
    )

    return new_set


async def get_user_sets(session, name: str):
    """
        Возвращает:
        - sets
        - unassigned_words
        Перед возвратом пересчитывает актуальное состояние через check_and_create_set.
        """
    user = await session.scalar(select(User).where(User.nickname == name))
    if not user:
        return {
            "sets": [],
            "unassigned_words": []
        }

    unassigned_words = await check_and_create_set(user.id)

    sets_result = await session.scalars(
        select(Set).where(Set.user_id == user.id)
    )
    sets = list(sets_result)

    # Для каждого сета — получаем word_ids
    result = []
    for s in sets:
        word_ids = list(await session.scalars(
            select(SetWord.word_id).where(SetWord.set_id == s.id)
        ))
        if not word_ids:
            continue
        result.append({
            "id": s.id,
            "name": s.name,
            "word_ids": word_ids,
        })

    return {
        "sets": result,
        "unassigned_words": unassigned_words
    }

async def get_words_from_set(session, word_ids: list[int]):
    backend_logger.info(f"[GET WORDS] Start fetching words for IDs: {word_ids}")
    result_list = []
    for i in word_ids:
        backend_logger.info(f"[GET WORDS] Fetching words for ID: {i}")
        item = (await session.scalars(select(Word).where(Word.id == i))).first()

        if item is not None:
            result_list.append({
                "id": item.id,
                "word": item.word
            })
            backend_logger.info(f"[GET WORDS] Found word: id={item.id}, word='{item.word}'")

    backend_logger.info(f"[GET WORDS] Final result list: {result_list}")
    return result_list


async def set_delete(session, req: SetDeleteRequest):
    # 1. Найти сет и проверить владельца
    set_obj = await session.scalar(
        select(Set).where(Set.id == req.set_id, Set.user_id == req.user_id)
    )
    if not set_obj:
        return None

    # 2. Слова сета — из БД, не с фронта
    word_ids = list(await session.scalars(
        select(SetWord.word_id).where(SetWord.set_id == req.set_id)
    ))

    # 3. Опциональная сверка с фронтом
    if req.word_ids is not None and set(req.word_ids) != set(word_ids):
        backend_logger.warning("word_ids mismatch for set %s", req.set_id)

    # 4. Удаление в одной транзакции
    await session.execute(
        SetWord.__table__.delete().where(SetWord.set_id == req.set_id)
    )
    if word_ids:
        await session.execute(
            Word.__table__.delete().where(
                Word.id.in_(word_ids),
                Word.user_id == req.user_id,
            )
        )
    await session.delete(set_obj)
    await session.commit()

    return {
        "set_id": req.set_id,
        "name": set_obj.name,
        "deleted_word_ids": word_ids,
        "deleted_words_count": len(word_ids),
    }


async def set_rename(session, req: SetDeleteRequest):
    # 1. Найти сет и проверить владельца
    set_obj = await session.scalar(
        select(Set).where(Set.id == req.set_id, Set.user_id == req.user_id)
    )
    if not set_obj:
        return None

    # 2. Обновить имя
    set_obj.name = req.name

    # 3. Сохранить изменения
    await session.commit()
    await session.refresh(set_obj)

    return {
        "set_id": req.set_id,
        "name": set_obj.name,
        "user_id": req.user_id,
    }
