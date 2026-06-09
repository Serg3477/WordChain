# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Проект: WordChain

Асинхронный сервис перевода и заучивания слов: FastAPI-бэкенд + vanilla-JS фронтенд,
PostgreSQL для хранения, Redis для кэширования ответов OpenAI.

## Стек
- Python 3.12, FastAPI, SQLAlchemy 2.0 (async) + asyncpg, openai = "^2.14.0"
- JavaScript Vanilla (ES-модули, без сборки)
- PostgreSQL, Redis, Docker
- Пакетный менеджер: poetry

## Правила работы со мной
- Всегда общаться со мной на русском языке.
- В коде всегда следовать принципам SOLID, KISS.
- На запрос создать/изменить/удалить код — сначала предоставлять решение (с полным
  объяснением и сравнением с существующим кодом), никогда не применять автоматически,
  только по отдельному запросу.
- По запросу сначала давать инструкцию-подсказки, как выполнить; затем по просьбе —
  больше подсказок/уточнений или готовое решение.
- По моей команде — отменять последние изменения (твои или мои, например за 5 минут).
- При анализе кода предлагать решения на основе современных эффективных методик и
  принципов структурирования.

## Команды

### Backend (из каталога `backend/`)
- Установка зависимостей: `poetry install`
- Запуск в dev-режиме: `poetry run uvicorn app.main:app --reload --port 8000`
- Тесты: `poetry run pytest` (каталог `tests/` пока пуст)
- Один тест: `poetry run pytest tests/test_file.py::test_name`

### Frontend
- Статика без сборки; в dev открывается напрямую или раздаётся nginx.
- Ожидает backend по адресу `http://<hostname>:8000` (см. `frontend/core/config.js`).

### Docker (из корня)
- Полный запуск: `docker compose up --build`
- Контейнеры: `wordchain-db` (Postgres, host-порт 5440), `wordchain-redis`,
  `wordchain-backend`, `wordchain-frontend` (host-порт 8000).

### База данных (dev)
- Локальный Postgres: `psql -h localhost -p 5432 -U postgres -d wordchain` (пароль в `backend/.env`).
- Через docker-контейнер маппинг — порт `5440`.

## Dev / Docker режимы (важно)
Переключение между локальной разработкой и Docker делается **вручную** правкой
комментариев в нескольких файлах — это частый источник ошибок:
- `backend/.env` — блоки `# Dev-mode` / `# Docker-mode` (`DB_HOST`, и т.д.).
- `backend/app/utils/cache.py` — URL Redis (`redis://localhost:6379` vs `redis://redis:6379`).
- `docker-compose.yml` — host (`db`/`redis`) против `localhost`.

## Архитектура backend

Слои (зависимости сверху вниз):
`routers/` → `services/` → `db/repositories/` → `db/models/`

- **routers/** — по одному файлу на эндпоинт, каждый создаёт собственный `APIRouter`;
  все подключаются вручную в `app/main.py` через `include_router`. HTTP-слой: разбор
  запроса, вызов сервиса, формирование ответа.
- **services/** — бизнес-логика (перевод через OpenAI, формирование сетов, JWT, и т.д.).
- **db/repositories/** — инкапсулируют запросы SQLAlchemy (CRUD по моделям).
- **db/models/** — ORM-модели (`User`, `Word`, `Set`, `SetWord`, `Settings`).
- **schemas/** — Pydantic-схемы запросов/ответов.
- **db/session.py** — async-engine и `async_session`; сессии берутся как
  `async with async_session()` напрямую в роутерах/сервисах.

### Инициализация схемы
Таблицы создаются на старте приложения через `Base.metadata.create_all`
(`db/init_db.py`, событие `startup`). Alembic в репозитории есть (`backend/alembic/`),
но в текущем потоке миграции не применяются — менять схему через изменение моделей.

### Конфигурация
`db/config.py` (`pydantic-settings`) читает `backend/.env`; собирает `database_url`
для `postgresql+asyncpg`. Здесь же `SECRET_KEY`, `OPENAI_API_KEY`, `MODEL`.

### Аутентификация
JWT (HS256, `services/jwt_service.py`, срок 30 дней). Гостевые пользователи создаются
автоматически (`routers/auth.py` `POST /guest`); токен передаётся в заголовке
`Authorization: Bearer`. Текущий пользователь — через зависимость `get_current_user`
(`routers/dependencies.py`).

### Перевод и кэширование (services/word_service.py + utils/)
- Обёртка над `AsyncOpenAI` (модель из `settings.MODEL`).
- Многоуровневый кэш в Redis: полный результат (`:full`) и отдельные части
  (`:translation`, `:transcription`, ...). Схема ключей: `translate:v2:{src}:{tgt}:{word}`.
- `utils/cache.py` / `utils/atomic_cache.py` — get-or-set с TTL и защитой от
  повреждённого кэша; `word_unrepeat_cache.py` — генерация неповторяющихся слов.
- Слово нормализуется (`_normalize_word`), языки — через алиасы (`_normalize_lang`).
- При обновлении/удалении слова кэш инвалидируется (`collect_translation_keys` + `delete_keys`).

### Логика сетов (services/set_service.py)
- `SET_SIZE = 6`: слова пользователя, не входящие ни в один сет, копятся; как только их
  ровно 6 — автоматически создаётся новый сет (`Set-N`).
- При удалении слова сеты, ставшие пустыми, удаляются автоматически.

## Архитектура frontend (vanilla JS, ES-модули)

Точка входа `frontend/main.js`: строит базовый DOM, инициализирует `windowManager`,
подписывается на изменения состояния, запускает `layoutDetector`, инициализирует сессию.

- **core/state.js** — глобальное реактивное состояние (`state`, `subscribe`, `setState`)
  плюс per-key listeners (`on`/`notify`). Это активная система состояния (в репозитории
  есть и `core/reactive.js`, но используется `state.js`).
- **core/api.js** — `apiRequest()`: fetch с JWT из state, базовый URL из `core/config.js`.
- **core/windowManager.js** — управление экранами (mobile) и модальными окнами.
- **core/layoutDetector.js** — определяет `mobile`/`desktop` по ширине/userAgent.
- **layouts/mobile/** — текущая реализация UI. **Десктоп-вёрстка ещё не реализована**:
  `main.js` рендерит mobile для обоих layout как временный fallback.
- **ui/** — переиспользуемые компоненты (кнопки, модалки уведомления/подтверждения, и т.д.).
- **api/** — тонкие обёртки над `apiRequest` по доменам (`word.js`, `sets.js`, `user.js`, ...).

## Примечания
- Корневой `main.py` — это устаревшая заглушка FastAPI («Hello World»); рабочее приложение
  находится в `backend/app/main.py`.
- CORS открыт для всех origin (`allow_origins=["*"]`) — для прода сузить.
- Логирование через loguru (`backend/app/logger/`), вывод в `backend/logs/`.
