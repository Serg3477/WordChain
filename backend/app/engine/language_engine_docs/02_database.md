# Language Learning Engine — Database Specification v1

This document describes the intended database model. The live PostgreSQL database is the source of truth. Codex must inspect the actual schema before modifying it.

---

## 1. `intents`

Purpose: stores semantic communication intentions.

Expected important columns:

```text
id
code JSONB
category
semantic_tags
is_active
created_at
```

The exact live schema may differ because obsolete columns were removed during development.

`code` contains localized titles plus the stable system identifier:

```json
{
  "system": "REQUEST_INFORMATION",
  "en": "Request information",
  "ru": "Запросить информацию",
  "ua": "Запитати інформацію",
  "de": "Information erfragen",
  "fr": "Demander une information",
  "es": "Pedir información",
  "it": "Chiedere informazioni",
  "pl": "Poprosić o informację"
}
```

Do not add `min_level` or `max_level` to intents. Level belongs to templates.

---

## 2. `expression_strategy`

Purpose: stores valid expression forms.

Expected columns:

```text
id
is_active
created_at
code JSONB
```

Current valid system values:

```text
SIMPLE_DECLARATIVE
SIMPLE_NEGATIVE
YES_NO_QUESTION
WH_QUESTION
TAG_QUESTION
PASSIVE
MODAL
CONDITIONAL
REPORTED_SPEECH
RELATIVE_CLAUSE
EXCLAMATION
IMPERATIVE
CHOICE
```

Known IDs from the current database snapshot:

```text
1  SIMPLE_DECLARATIVE
2  SIMPLE_NEGATIVE
3  YES_NO_QUESTION
4  WH_QUESTION
5  TAG_QUESTION
6  PASSIVE
7  MODAL
8  CONDITIONAL
13 REPORTED_SPEECH
14 RELATIVE_CLAUSE
15 EXCLAMATION
16 IMPERATIVE
17 CHOICE
```

Do not assume these IDs forever. Query by:

```sql
code->>'system'
```

The following obsolete semantic relations were deleted:

```text
COMPARISON
CAUSATION
PURPOSE
RESULT
SEQUENCE
CONTRAST
EMPHASIS
```

They may still appear as template blocks, but not as expression strategies.

---

## 3. `intent_expression_strategy_map`

Purpose: many-to-many mapping from intents to allowed expression strategies.

Expected columns:

```text
intent_id
expression_strategy_id
```

No `priority` column is required in Engine v1.

Recommended uniqueness:

```sql
PRIMARY KEY (intent_id, expression_strategy_id)
```

Never insert mappings by hardcoded IDs unless the IDs were just queried from the same database.

Preferred insertion pattern:

```sql
INSERT INTO intent_expression_strategy_map (
    intent_id,
    expression_strategy_id
)
SELECT i.id, es.id
FROM intents i
JOIN expression_strategy es
  ON es.code->>'system' = 'IMPERATIVE'
WHERE i.code->>'system' = 'REQUEST_ACTION'
ON CONFLICT DO NOTHING;
```

The map must be reviewed after template population. Only natural, useful combinations should remain.

---

## 4. `templates`

Purpose: stores explicit sentence patterns.

Expected columns:

```text
id BIGSERIAL PRIMARY KEY
template_key VARCHAR(...) UNIQUE
code JSONB NOT NULL
level VARCHAR(2) NOT NULL
tense VARCHAR(...) NOT NULL
active BOOLEAN NOT NULL DEFAULT TRUE
created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
```

Recommended level constraint:

```sql
CHECK (level IN ('A1','A2','B1','B2','C1','C2'))
```

Example:

```sql
INSERT INTO templates (template_key, code, level, tense)
VALUES (
    'RI_WH_001',
    '{"en":"QUESTION_PHRASE QUESTION_VERB_GROUP SUBJECT OBJECT"}'::jsonb,
    'A1',
    'ANY'
);
```

### `code` rules

- `en` is mandatory.
- Other languages are stored only if their pattern differs.
- Values are linear DSL strings.
- Block names are uppercase snake case.
- No hidden optional-list structure.
- Different valid positions require different templates.

---

## 5. `expression_strategy_templates_map`

Purpose: many-to-many mapping from expression strategies to templates.

Expected columns:

```text
expression_strategy_id
template_id
```

Recommended definition:

```sql
CREATE TABLE expression_strategy_templates_map (
    expression_strategy_id BIGINT NOT NULL
        REFERENCES expression_strategy(id) ON DELETE CASCADE,
    template_id BIGINT NOT NULL
        REFERENCES templates(id) ON DELETE CASCADE,
    PRIMARY KEY (expression_strategy_id, template_id)
);
```

Because template keys include intent prefixes during the current population phase, Codex must not infer ownership only from the key. Use the actual strategy code and the project documentation.

Recommended mapping by stable key:

```sql
INSERT INTO expression_strategy_templates_map (
    expression_strategy_id,
    template_id
)
SELECT es.id, t.id
FROM expression_strategy es
JOIN templates t
  ON t.template_key BETWEEN 'RI_WH_001' AND 'RI_WH_007'
WHERE es.code->>'system' = 'WH_QUESTION'
ON CONFLICT DO NOTHING;
```

For non-contiguous keys, use an explicit `IN` list.

---

## 6. Future tables

The following are planned but not finalized:

```text
block_types
chunk_candidates
grammar_groups
template_usage_history
user_exercise_history
user_progress
lesson_results
```

Do not create them without an explicit design step.

---

## 7. Required Codex inspection queries

Before continuing template population, run:

```sql
SELECT id, code->>'system' AS system
FROM intents
ORDER BY id;
```

```sql
SELECT id, code->>'system' AS system
FROM expression_strategy
ORDER BY id;
```

```sql
SELECT
    i.code->>'system' AS intent,
    es.code->>'system' AS strategy
FROM intent_expression_strategy_map m
JOIN intents i ON i.id = m.intent_id
JOIN expression_strategy es ON es.id = m.expression_strategy_id
ORDER BY i.id, es.id;
```

```sql
SELECT id, template_key, level, tense, code
FROM templates
ORDER BY id;
```

```sql
SELECT template_key, COUNT(*)
FROM templates
GROUP BY template_key
HAVING COUNT(*) > 1;
```

```sql
SELECT
    split_part(template_key, '_', 1) AS intent_prefix,
    split_part(template_key, '_', 2) AS strategy_prefix,
    COUNT(*) AS total
FROM templates
GROUP BY 1, 2
ORDER BY 1, 2;
```

---

## 8. Safe batch pattern

Use a transaction:

```sql
BEGIN;

INSERT INTO templates (...)
VALUES (...), (...), (...);

-- inspect inserted rows
SELECT id, template_key
FROM templates
WHERE template_key IN (...);

COMMIT;
```

If validation fails:

```sql
ROLLBACK;
```

Do not delete or overwrite existing rows merely to resolve a key collision. First inspect whether the batch already exists.
