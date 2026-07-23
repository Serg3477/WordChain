# WordChain Engine v1 — технический конспект

## 1. Назначение движка

Engine v1 — это грамматико-семантический генератор учебных предложений.

Он не хранит готовые предложения как основной источник данных. Вместо этого он:

1. выбирает коммуникативный Intent;
2. выбирает допустимую Expression Strategy;
3. выбирает Template;
4. разбирает шаблон на блоки;
5. подбирает для каждого блока ChunkCandidate;
6. проверяет совместимость кандидатов через `self` и `match`;
7. собирает итоговое предложение в нужном порядке;
8. может параллельно собирать вариант на другом языке из тех же кандидатов.

Главный принцип:

```text
Intent
→ ExpressionStrategy
→ Template
→ ChunkCandidate
→ sentence
```

Движок задуман как многоязычный. Сейчас практически проверены английский и французский.

---

## 2. Текущая схема таблиц

### 2.1. `intents`

```text
id              integer PK
code            jsonb NOT NULL
category        varchar NOT NULL
min_level       varchar NOT NULL DEFAULT 'A1'
max_level       varchar NOT NULL DEFAULT 'C2'
semantic_tags   jsonb NULL DEFAULT []
active          boolean NOT NULL DEFAULT true
created_at      timestamp NOT NULL DEFAULT now()
```

Пример `code`:

```json
{
  "system": "STATE_FACT",
  "en": "State a fact",
  "fr": "Énoncer un fait",
  "ru": "Сообщить факт",
  "ua": "Повідомити факт"
}
```

`system` — внутренний машинный код Intent.

---

### 2.2. `intent_expression_strategy_map`

```text
intent_id               integer FK
expression_strategy_id  integer FK
active                  boolean NOT NULL DEFAULT true
```

Это полноценная ORM-сущность.

Связь:

```text
Intent 1 ─── N IntentExpressionStrategyMap N ─── 1 ExpressionStrategy
```

---

### 2.3. `grammar_strategy`

Python-класс называется `ExpressionStrategy`, но физическое имя таблицы исторически осталось `grammar_strategy`.

```text
id          integer PK
active      boolean NOT NULL DEFAULT true
created_at  timestamp NOT NULL DEFAULT now()
code        jsonb NOT NULL
```

Пример:

```json
{
  "system": "SIMPLE_DECLARATIVE",
  "en": "Simple declarative",
  "fr": "Déclaration simple",
  "ru": "Простое утверждение"
}
```

---

### 2.4. `expression_strategy_templates_map`

```text
expression_strategy_id  integer FK
template_id             bigint FK
```

Полноценный ORM-класс.

Связь:

```text
ExpressionStrategy 1 ─── N Map N ─── 1 Template
```

---

### 2.5. `templates`

```text
id             bigint PK
code           jsonb NOT NULL
level          varchar NOT NULL
tense          varchar NOT NULL
active         boolean NOT NULL DEFAULT true
created_at     timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
template_key   varchar NOT NULL
resolve_order  jsonb NOT NULL DEFAULT {}
```

Пример обычного шаблона:

```json
{
  "en": "SUBJECT AFFIRMATIVE_VERB_GROUP OBJECT",
  "fr": "SUBJECT AFFIRMATIVE_VERB_GROUP OBJECT"
}
```

Пример вопросительного шаблона:

```json
{
  "en": "QUESTION_AUX SUBJECT VERB_COMPLEMENT OBJECT",
  "fr": "QUESTION_PHRASE SUBJECT AFFIRMATIVE_VERB_GROUP OBJECT"
}
```

---

### 2.6. `chunk_candidates`

```text
id          bigint PK
block_code  varchar NOT NULL
candidate   jsonb NOT NULL
level       varchar NOT NULL
active      boolean NOT NULL DEFAULT true
created_at  timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
self        jsonb NOT NULL DEFAULT {}
match       jsonb NOT NULL DEFAULT {}
```

В ORM:

```python
self_features = mapped_column("self", JSONB, ...)
match_features = mapped_column("match", JSONB, ...)
```

`ChunkCandidate` не связан с `Template` внешним ключом.

Связь логическая:

```text
Template.code содержит block_code
ChunkCandidate.block_code содержит тот же block_code
```

---

## 3. DSL шаблонов

Template хранит последовательность логических блоков.

Пример:

```text
SUBJECT AFFIRMATIVE_VERB_GROUP OBJECT
```

Блоки не являются словами. Это типы синтаксических фрагментов.

Основные блоки ядра:

```text
SUBJECT
QUESTION_AUX
QUESTION_PHRASE
NEGATIVE_AUX
VERB_COMPLEMENT
AFFIRMATIVE_VERB_GROUP
NEGATIVE_VERB_GROUP
OBJECT
```

Дополнительные блоки:

```text
ATTRIBUTE
COMPLEMENT
PLACE
TIME
DURATION
REASON
PURPOSE
REFERENCE_POINT
ADVERB
EMPHASIS_GROUP
CONNECTOR
CLAUSE
SECOND_CLAUSE
RELATIVE_CLAUSE
THAT_CLAUSE
WH_CLAUSE
PASSIVE_GROUP
PHRASAL_VERB
PHRASAL_OBJECT
MODAL_GROUP
REPORTING_VERB
TAG_QUESTION
и другие
```

---

## 4. Разделение `code` и `resolve_order`

Это одно из ключевых решений архитектуры.

### `code`

Определяет порядок вывода блоков в готовом предложении.

```text
QUESTION_AUX SUBJECT VERB_COMPLEMENT OBJECT
```

### `resolve_order`

Определяет порядок выбора кандидатов.

```text
SUBJECT QUESTION_AUX VERB_COMPLEMENT OBJECT
```

Причина: в английском вопросе вспомогательный глагол стоит перед подлежащим, но его форма зависит от подлежащего.

Пример:

```text
render order:
QUESTION_AUX → SUBJECT → VERB_COMPLEMENT → OBJECT

resolve order:
SUBJECT → QUESTION_AUX → VERB_COMPLEMENT → OBJECT
```

В базе `resolve_order` хранится в таком же строковом DSL-формате, как `code`.

Пример:

```json
{
  "en": "SUBJECT QUESTION_AUX VERB_COMPLEMENT OBJECT"
}
```

Если для языка `resolve_order` отсутствует, Python использует `code`.

```python
resolve_pattern = (
    template.resolve_order.get(language)
    or template.code[language]
)
```

Важный принцип:

```text
данные в базе — простые и наглядные;
логика сопоставления позиций — в Python.
```

---

## 5. Различия английского и французского DSL

Все 642 шаблона были дополнены французской формой.

Обнаружено 383 различия, и все они объясняются небольшим числом правил.

### 5.1. Английские Yes/No-вопросы

```text
en:
QUESTION_AUX SUBJECT VERB_COMPLEMENT ...

fr:
QUESTION_PHRASE SUBJECT AFFIRMATIVE_VERB_GROUP ...
```

Пример:

```text
Does she read the report?
Est-ce qu’elle lit le rapport ?
```

---

### 5.2. Английские WH-вопросы

```text
en:
QUESTION_PHRASE QUESTION_AUX SUBJECT VERB_COMPLEMENT ...

fr:
QUESTION_PHRASE SUBJECT AFFIRMATIVE_VERB_GROUP ...
```

Французский `QUESTION_PHRASE` может содержать цельные формы:

```text
pourquoi est-ce que
quand est-ce que
où est-ce que
comment est-ce que
```

---

### 5.3. Отрицание

```text
en:
SUBJECT NEGATIVE_AUX VERB_COMPLEMENT ...

fr:
SUBJECT NEGATIVE_VERB_GROUP ...
```

Примеры французского цельного блока:

```text
ne lit pas
n’a pas terminé
ne travaillait pas
```

---

### 5.4. Наречия

В нескольких английских шаблонах:

```text
SUBJECT ADVERB AFFIRMATIVE_VERB_GROUP OBJECT
```

Во французском:

```text
SUBJECT AFFIRMATIVE_VERB_GROUP ADVERB OBJECT
```

---

### 5.5. Усилительные элементы

Английский:

```text
SUBJECT EMPHASIS_GROUP AFFIRMATIVE_VERB_GROUP
```

Французский:

```text
SUBJECT AFFIRMATIVE_VERB_GROUP EMPHASIS_GROUP
```

---

## 6. Граф соседства

Для каждого языка был построен граф переходов:

```text
BLOCK_A → BLOCK_B
```

Примеры английского ядра:

```text
QUESTION_PHRASE → QUESTION_AUX
QUESTION_AUX → SUBJECT
SUBJECT → VERB_COMPLEMENT
SUBJECT → NEGATIVE_AUX
NEGATIVE_AUX → VERB_COMPLEMENT
VERB_COMPLEMENT → OBJECT
```

Примеры французского ядра:

```text
QUESTION_PHRASE → SUBJECT
SUBJECT → AFFIRMATIVE_VERB_GROUP
SUBJECT → NEGATIVE_VERB_GROUP
AFFIRMATIVE_VERB_GROUP → OBJECT
NEGATIVE_VERB_GROUP → OBJECT
```

Главный вывод:

```text
граф определяет допустимые типы соседства;
self/match определяют совместимость конкретных кандидатов.
```

---

## 7. Логика `self` и `match`

### `self`

Описывает свойства самого кандидата.

### `match`

Описывает требования к последующим зависимым кандидатам.

Пример `SUBJECT`:

```json
{
  "candidate": {
    "en": "she",
    "fr": "elle"
  },
  "self": {
    "en": {
      "person": 3,
      "number": "singular",
      "gender": "feminine",
      "animacy": "human",
      "agreement": "3sg",
      "semantic_class": "person"
    },
    "fr": {
      "person": 3,
      "number": "singular",
      "gender": "feminine",
      "animacy": "human",
      "semantic_class": "person"
    }
  },
  "match": {
    "en": {
      "person": 3,
      "number": "singular",
      "agreement": "3sg"
    },
    "fr": {
      "person": 3,
      "number": "singular",
      "gender": "feminine"
    }
  }
}
```

---

## 8. Параметр `agreement`

Для английского подлежащего добавлен компактный код согласования:

```text
1sg
2sg
3sg
1pl
2pl
3pl
```

Примеры:

```text
I            → 1sg
you / tu     → 2sg
he           → 3sg
we           → 1pl
you / vous   → 2pl
they         → 3pl
```

Он используется для выбора:

```text
QUESTION_AUX
AFFIRMATIVE_VERB_GROUP
NEGATIVE_AUX
```

---

## 9. `QUESTION_AUX`

Заполнены английские кандидаты:

```text
do
does
did
am
is
are
was
were
has
have
had
will
```

Пример:

```json
{
  "candidate": {"en": "does"},
  "self": {
    "en": {
      "tense": ["PRESENT_SIMPLE"],
      "agreement": ["3sg"],
      "auxiliary": "do",
      "polarity": "affirmative"
    }
  },
  "match": {
    "en": {
      "verb_form": "base",
      "auxiliary": "do"
    }
  }
}
```

`QUESTION_AUX` выбирается после `SUBJECT`, несмотря на позицию перед ним в `code`.

---

## 10. `VERB_COMPLEMENT`

Для тестового глагола `write` заполнены формы:

```text
write
writing
be writing
written
have written
been writing
have been writing
```

Они покрывают:

```text
PRESENT_SIMPLE
PAST_SIMPLE
FUTURE_SIMPLE
PRESENT_CONTINUOUS
PAST_CONTINUOUS
FUTURE_CONTINUOUS
PRESENT_PERFECT
PAST_PERFECT
FUTURE_PERFECT
PRESENT_PERFECT_CONTINUOUS
PAST_PERFECT_CONTINUOUS
FUTURE_PERFECT_CONTINUOUS
```

Пример:

```json
{
  "candidate": {"en": "written"},
  "self": {
    "en": {
      "lemma": "write",
      "tense": ["PRESENT_PERFECT", "PAST_PERFECT"],
      "auxiliary": ["have"],
      "verb_form": "past_participle",
      "valency": "transitive",
      "object_role": "direct",
      "event_class": "writing"
    }
  },
  "match": {
    "en": {
      "entity_role": "direct_object",
      "semantic_roles": ["writable"]
    }
  }
}
```

---

## 11. Семантические способности объектов

Решено не привязывать глаголы к конкретным словам.

Не так:

```json
{
  "allowed_objects": ["report", "email", "letter"]
}
```

А так:

```json
{
  "semantic_roles": ["writable"]
}
```

Объекты получают способности:

```text
readable
writable
sendable
publishable
printable
```

Пример объекта:

```json
{
  "candidate": {
    "en": "a report",
    "fr": "un rapport"
  },
  "self": {
    "en": {
      "entity_role": "direct_object",
      "semantic_class": "report",
      "semantic_roles": [
        "readable",
        "writable",
        "sendable"
      ],
      "number": "singular",
      "countable": true,
      "definiteness": "indefinite",
      "animacy": "inanimate"
    },
    "fr": {
      "entity_role": "direct_object",
      "semantic_class": "report",
      "semantic_roles": [
        "readable",
        "writable",
        "sendable"
      ],
      "number": "singular",
      "gender": "masculine",
      "countable": true,
      "definiteness": "indefinite",
      "animacy": "inanimate"
    }
  },
  "match": {}
}
```

Уже заполнены объекты:

```text
a report / un rapport
the report / le rapport
an email / un e-mail
the email / l’e-mail
a letter / une lettre
the letter / la lettre
a message / un message
the message / le message
an article / un article
the document / le document
```

---

## 12. `AFFIRMATIVE_VERB_GROUP`

Для второго тестового шаблона заполнен глагол:

```text
read / lire
```

Формы Present Simple:

```text
1sg: read  / lis
2sg: read  / lis
3sg: reads / lit
1pl: read  / lisons
2pl: read  / lisez
3pl: read  / lisent
```

Пример:

```json
{
  "candidate": {
    "en": "reads",
    "fr": "lit"
  },
  "self": {
    "en": {
      "lemma": "read",
      "tense": ["PRESENT_SIMPLE"],
      "agreement": "3sg",
      "polarity": "affirmative",
      "voice": "active",
      "verb_form": "finite",
      "valency": "transitive",
      "event_class": "reading"
    },
    "fr": {
      "lemma": "lire",
      "tense": ["PRESENT_SIMPLE"],
      "agreement": "3sg",
      "polarity": "affirmative",
      "voice": "active",
      "verb_form": "finite",
      "valency": "transitive",
      "event_class": "reading"
    }
  },
  "match": {
    "en": {
      "entity_role": "direct_object",
      "semantic_roles": ["readable"]
    },
    "fr": {
      "entity_role": "direct_object",
      "semantic_roles": ["readable"]
    }
  }
}
```

---

## 13. Уже работающие тестовые цепочки

### Вопросительная английская цепочка

Template:

```text
QUESTION_AUX SUBJECT VERB_COMPLEMENT OBJECT
```

Resolve order:

```text
SUBJECT QUESTION_AUX VERB_COMPLEMENT OBJECT
```

Механика:

```text
SUBJECT.match.agreement
→ QUESTION_AUX.self.agreement

QUESTION_AUX.self.tense + auxiliary
→ VERB_COMPLEMENT.self.tense + auxiliary

VERB_COMPLEMENT.match.semantic_roles
→ OBJECT.self.semantic_roles
```

Рабочие сочетания:

```text
do / does → write
did       → write
am/is/are → writing
was/were  → writing
has/have  → written
has/have  → been writing
had       → written
had       → been writing
will      → write
will      → be writing
will      → have written
will      → have been writing
```

---

### Утвердительная двуязычная цепочка

Template:

```text
SUBJECT AFFIRMATIVE_VERB_GROUP OBJECT
```

Рабочие примеры:

```text
I read a report.
Je lis un rapport.

She reads the email.
Elle lit l’e-mail.

The students read an article.
Les étudiants lisent un article.
```

---

## 14. Выявленный будущий семантический нюанс

Формально движок уже может собрать:

```text
The company reads a letter.
L’entreprise lit une lettre.
```

Это грамматически корректно, но не всегда естественно.

Позже потребуется дополнительная совместимость:

```text
SUBJECT semantic roles
↔
verb allowed subject roles
```

Например:

```text
reader
writer
speaker
organization_actor
human_actor
```

Но это не добавляется до первой backend-версии. Сейчас задача — построить работающий вертикальный срез и увидеть реальные ошибки через frontend.

---

## 15. План backend-логики

Минимальный pipeline:

```text
1. выбрать Intent;
2. получить активные ExpressionStrategy через map;
3. выбрать ExpressionStrategy;
4. получить активные Template через map;
5. отфильтровать Template по level и tense;
6. выбрать Template;
7. получить code[language];
8. получить resolve_order[language] или code[language];
9. сопоставить блоки resolve_order с позициями в code;
10. последовательно выбрать ChunkCandidate;
11. фильтровать по self, предыдущему match и контексту шаблона;
12. сохранить кандидатов по render-position;
13. собрать итоговую строку по code;
14. собрать параллельный перевод из candidate[target_language];
15. вернуть подробный debug JSON.
```

---

## 16. Почему выбранные блоки хранятся по позиции

Нельзя хранить только так:

```python
selected["CLAUSE"] = candidate
```

Потому что один block_code может повторяться:

```text
CLAUSE CONNECTOR CLAUSE
```

Нужно:

```python
selected_by_position: dict[int, SelectedChunk]
```

---

## 17. Предлагаемые runtime dataclass

ORM-классы отражают таблицы.

Dataclass используются для временного состояния движка в памяти.

### `SelectedChunk`

```python
from dataclasses import dataclass
from typing import Any


@dataclass(slots=True, frozen=True)
class SelectedChunk:
    render_position: int
    block_code: str
    candidate_id: int
    values: dict[str, str]
    self_features: dict[str, Any]
    match_features: dict[str, Any]
```

### `ResolutionState`

```python
from dataclasses import dataclass, field
from typing import Any


@dataclass(slots=True)
class ResolutionState:
    language: str
    level: str
    tense: str

    selected_by_position: dict[int, SelectedChunk] = field(
        default_factory=dict
    )

    context: dict[str, Any] = field(
        default_factory=dict
    )
```

`@dataclass` автоматически создаёт `__init__`, `__repr__` и сравнение объектов.

`slots=True` запрещает случайные неизвестные атрибуты.

`frozen=True` делает уже выбранный блок неизменяемым.

ORM-объекты не стоит хранить напрямую в `SelectedChunk`: runtime-состояние должно быть независимо от SQLAlchemy session.

---

## 18. ORM-зависимости

Все таблицы представлены полноценными ORM-классами:

```text
Intent
IntentExpressionStrategyMap
ExpressionStrategy
ExpressionStrategyTemplatesMap
Template
ChunkCandidate
```

Связи:

```text
Intent.expression_strategy_links
IntentExpressionStrategyMap.intent
IntentExpressionStrategyMap.expression_strategy

ExpressionStrategy.intent_links
ExpressionStrategy.template_links

ExpressionStrategyTemplatesMap.expression_strategy
ExpressionStrategyTemplatesMap.template

Template.expression_strategy_links
```

`ChunkCandidate` не имеет `relationship`, поскольку привязка к Template выполняется через DSL block_code.

---

## 19. Подключение ORM-моделей

Текущая инфраструктура:

```python
# app/db/base.py
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass
```

```python
# app/db/session.py
engine = create_async_engine(...)
async_session = async_sessionmaker(...)
```

```python
# app/db/init_db.py
from app.db.base import Base
from app.db.session import engine

import app.db.models  # noqa: F401


async def init_models() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
```

Критично:

```text
все ORM-модули должны быть импортированы до create_all()
```

Иначе таблицы не попадут в `Base.metadata`.

`create_all()` создаёт отсутствующие таблицы, но не является системой миграций.

---

## 20. Ближайший план работ

1. Подключить новые ORM-модели к `Base.metadata`.
2. Проверить, что все шесть таблиц зарегистрированы.
3. Создать repository для:
   - Intent;
   - ExpressionStrategy;
   - Template;
   - ChunkCandidate.
4. Создать функцию сопоставления `resolve_order` с render-позициями.
5. Создать matcher для:
   - scalar ↔ scalar;
   - scalar ↔ array;
   - array ↔ scalar;
   - пересечения `semantic_roles`.
6. Реализовать генерацию двух тестовых шаблонов:
   - `SUBJECT AFFIRMATIVE_VERB_GROUP OBJECT`;
   - `QUESTION_AUX SUBJECT VERB_COMPLEMENT OBJECT`.
7. Сделать debug API.
8. Подключить вывод предложений на frontend переводчика.
9. Исправлять механику на реальных результатах.
10. Только после этого продолжать массовое заполнение `chunk_candidates`.

---

## 21. Основные принципы, которые нельзя потерять

```text
1. Template.code — порядок отображения.
2. Template.resolve_order — порядок вычисления.
3. База хранит простые данные, логика остаётся в Python.
4. Граф блоков задаёт допустимое соседство типов.
5. self описывает кандидата.
6. match описывает требования к зависимым кандидатам.
7. Глагол не знает конкретные слова-объекты.
8. Семантическая совместимость строится через роли:
   readable, writable, sendable и т. д.
9. Языки могут иметь разные DSL-цепочки.
10. Выбранные блоки сохраняются по позиции, а не только по block_code.
11. Сначала строится небольшой работающий вертикальный срез.
12. Массовое наполнение базы — только после backend/frontend отладки.
```

---

## 22. Текущий статус

Готово:

- Intent;
- ExpressionStrategy;
- связи Intent ↔ Strategy;
- Template;
- связи Strategy ↔ Template;
- 642 многоязычных шаблона;
- английский и французский DSL;
- графы соседства;
- `resolve_order`;
- `ChunkCandidate`;
- 12 SUBJECT;
- 12 QUESTION_AUX;
- 7 VERB_COMPLEMENT для `write`;
- 10 OBJECT;
- 6 AFFIRMATIVE_VERB_GROUP для `read/lire`;
- SQL-проверки связности;
- тестовые двуязычные предложения.

Следующий этап:

```text
ORM registration
→ repositories
→ resolver
→ matcher
→ renderer
→ debug API
→ frontend
```
