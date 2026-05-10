# from sqlalchemy import select, func
# from datetime import datetime
#
# from app.db.models.set_word import SetWord
# from app.db.repositories.set_repository import SetRepository
# from app.db.repositories.set_word_repository import SetWordRepository
# from app.db.session import async_session
# from app.db.models.word import Word
# from app.logger.logger import backend_logger
#
#
# SET_SIZE = 6  # потом вынесем в настройки
#
#
# async def check_and_create_set(user_id: int):
#     async with async_session() as session:
#         # считаем слова пользователя
#         result = await session.execute(
#             select(func.count())
#             .select_from(Word)
#             .where(
#                 Word.user_id == user_id,
#                 Word.id.not_in(select(SetWord.word_id))
#             )
#         )
#         count = result.scalar()
#
#         backend_logger.info(f"User {user_id} has {count} unused words")
#
#         if count < SET_SIZE:
#             return  # не хватает слов для сета
#
#         if count % SET_SIZE != 0:
#             return  # не пора создавать сет
#
#         backend_logger.info(f"Creating new set for user {user_id}")
#         await create_set_from_last_words(session, user_id, SET_SIZE)
#
#
# async def create_set_from_last_words(session, user_id: int, size: int):
#     # берём последние N слов
#     result = await session.execute(
#         select(Word)
#         .where(
#             Word.user_id == user_id,
#             Word.id.not_in(select(SetWord.word_id))
#         )
#         .order_by(Word.id.desc())
#         .limit(size)
#     )
#     words = result.scalars().all()
#
#     # получаем номер последнего сета
#     last_number = await SetRepository.get_last_set_number(session, user_id)
#     next_number = last_number + 1
#
#     # формируем имя
#     name = f"Set-{next_number}"
#     description = f"Создан {datetime.now().strftime('%Y-%m-%d %H:%M')}"
#
#     # создаём Set через репозиторий
#     new_set = await SetRepository.create(
#         session=session,
#         user_id=user_id,
#         name=name,
#         description=description
#     )
#
#     # добавляем слова в set_words
#     for w in words:
#         await SetWordRepository.add_word_to_set(
#             session=session,
#             set_id=new_set.id,
#             word_id=w.id
#         )
#
#     return new_set


from sqlalchemy import select, func
from datetime import datetime

from app.db.repositories.set_repository import SetRepository
from app.db.repositories.set_word_repository import SetWordRepository
from app.db.session import async_session
from app.db.models.word import Word
from app.db.models.set_word import SetWord
from app.logger.logger import backend_logger

SET_SIZE = 6


async def check_and_create_set(user_id: int):
    backend_logger.info(f"[SET] Checking if user {user_id} needs a new set...")

    async with async_session() as session:

        # 1. Считаем ВСЕ слова пользователя
        total_words = await session.scalar(
            select(func.count()).select_from(Word).where(Word.user_id == user_id)
        )

        backend_logger.info(f"[SET] User {user_id} has total words: {total_words}")

        # 2. Считаем слова, которые уже в сетах
        used_words = await session.scalar(
            select(func.count()).select_from(SetWord).join(Word).where(Word.user_id == user_id)
        )

        backend_logger.info(f"[SET] User {user_id} has used words (in sets): {used_words}")

        # 3. Считаем свободные слова
        free_words = total_words - used_words

        backend_logger.info(f"[SET] User {user_id} has FREE words: {free_words}")

        # 4. Проверяем, пора ли создавать сет
        if free_words < SET_SIZE:
            backend_logger.info(f"[SET] Not enough free words ({free_words}/{SET_SIZE}). No new set.")
            return

        if free_words % SET_SIZE != 0:
            backend_logger.info(f"[SET] Free words not divisible by {SET_SIZE}. No new set.")
            return

        backend_logger.info(f"[SET] Conditions met. Creating new set for user {user_id}...")
        await create_set_from_last_words(session, user_id, SET_SIZE)



async def create_set_from_last_words(session, user_id: int, size: int):
    backend_logger.info(f"[SET] Selecting last {size} FREE words for user {user_id}...")

    # 1. Берём последние N свободных слов
    result = await session.execute(
        select(Word)
        .where(
            Word.user_id == user_id,
            Word.id.not_in(select(SetWord.word_id))
        )
        .order_by(Word.id.desc())
        .limit(size)
    )
    words = result.scalars().all()

    backend_logger.info(f"[SET] Selected words for new set: {[w.id for w in words]}")

    # 2. Получаем номер нового сета
    last_number = await SetRepository.get_last_set_number(session, user_id)
    next_number = last_number + 1

    backend_logger.info(f"[SET] Last set number: {last_number}, next: {next_number}")

    # 3. Создаём Set
    name = f"Set-{next_number}"
    description = f"Создан {datetime.now().strftime('%Y-%m-%d %H:%M')}"

    backend_logger.info(f"[SET] Creating Set '{name}' for user {user_id}")

    new_set = await SetRepository.create(
        session=session,
        user_id=user_id,
        name=name,
        description=description
    )

    backend_logger.info(f"[SET] Set created with ID {new_set.id}")

    # 4. Добавляем слова в set_words
    for w in words:
        backend_logger.info(f"[SET] Adding word {w.id} to set {new_set.id}")
        await SetWordRepository.add_word_to_set(
            session=session,
            set_id=new_set.id,
            word_id=w.id
        )

    backend_logger.info(f"[SET] Set {new_set.id} created successfully with words: {[w.id for w in words]}")

    return new_set
