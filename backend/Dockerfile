FROM python:3.12-slim

WORKDIR /app

# Копируем только файлы зависимостей
COPY pyproject.toml poetry.lock* /app/

# Устанавливаем Poetry и зависимости (без установки проекта)
RUN pip install --no-cache-dir poetry \
    && poetry config virtualenvs.create false \
    && poetry install --no-interaction --no-ansi --no-root

# Теперь копируем весь проект
COPY . /app

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
