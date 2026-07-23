BEGIN;

-- Engine v1 template seed.
-- This script is intentionally conservative:
-- - it inserts only missing template rows;
-- - it keeps English as the mandatory fallback;
-- - it computes the next template_key number per prefix;
-- - it does not create intent/strategy mappings.
--
-- Run the batch after the live PostgreSQL engine database is available.

-- 1) REQUEST_INFORMATION + WH_QUESTION
WITH
prefix AS (
    SELECT COALESCE(
               MAX((regexp_replace(template_key, '^RI_WH_(\\d+)$', '\\1'))::int),
               0
           ) + 1 AS start_n
    FROM templates
    WHERE template_key ~ '^RI_WH_\\d+$'
),
candidate_rows AS (
    VALUES
        (1, 'QUESTION_PHRASE QUESTION_VERB_GROUP SUBJECT AFFIRMATIVE_VERB_GROUP OBJECT', 'A1', 'ANY'),
        (2, 'QUESTION_PHRASE QUESTION_VERB_GROUP SUBJECT AFFIRMATIVE_VERB_GROUP OBJECT TIME', 'A1', 'ANY'),
        (3, 'QUESTION_PHRASE QUESTION_VERB_GROUP SUBJECT AFFIRMATIVE_VERB_GROUP OBJECT PLACE', 'A1', 'ANY'),
        (4, 'QUESTION_PHRASE QUESTION_VERB_GROUP SUBJECT AFFIRMATIVE_VERB_GROUP OBJECT PLACE TIME', 'A2', 'ANY')
),
missing_rows AS (
    SELECT
        row_number() OVER (ORDER BY ord) AS rn,
        pattern,
        level,
        tense
    FROM candidate_rows AS c(ord, pattern, level, tense)
    WHERE NOT EXISTS (
        SELECT 1
        FROM templates t
        WHERE t.code = jsonb_build_object('en', c.pattern)
          AND t.level = c.level
          AND t.tense = c.tense
    )
)
INSERT INTO templates (template_key, code, level, tense)
SELECT
    'RI_WH_' || lpad((prefix.start_n + missing_rows.rn - 1)::text, 3, '0') AS template_key,
    jsonb_build_object('en', missing_rows.pattern) AS code,
    missing_rows.level,
    missing_rows.tense
FROM missing_rows
CROSS JOIN prefix
ON CONFLICT (template_key) DO NOTHING;

-- 2) STATE_FACT + SIMPLE_DECLARATIVE
WITH
prefix AS (
    SELECT COALESCE(
               MAX((regexp_replace(template_key, '^SF_SD_(\\d+)$', '\\1'))::int),
               0
           ) + 1 AS start_n
    FROM templates
    WHERE template_key ~ '^SF_SD_\\d+$'
),
candidate_rows AS (
    VALUES
        (1, 'SUBJECT AFFIRMATIVE_VERB_GROUP', 'A1', 'PRESENT_SIMPLE'),
        (2, 'SUBJECT AFFIRMATIVE_VERB_GROUP COMPLEMENT', 'A1', 'PRESENT_SIMPLE'),
        (3, 'SUBJECT AFFIRMATIVE_VERB_GROUP OBJECT', 'A1', 'PRESENT_SIMPLE'),
        (4, 'SUBJECT AFFIRMATIVE_VERB_GROUP OBJECT TIME', 'A1', 'PRESENT_SIMPLE'),
        (5, 'SUBJECT AFFIRMATIVE_VERB_GROUP OBJECT PLACE', 'A1', 'PRESENT_SIMPLE')
),
missing_rows AS (
    SELECT
        row_number() OVER (ORDER BY ord) AS rn,
        pattern,
        level,
        tense
    FROM candidate_rows AS c(ord, pattern, level, tense)
    WHERE NOT EXISTS (
        SELECT 1
        FROM templates t
        WHERE t.code = jsonb_build_object('en', c.pattern)
          AND t.level = c.level
          AND t.tense = c.tense
    )
)
INSERT INTO templates (template_key, code, level, tense)
SELECT
    'SF_SD_' || lpad((prefix.start_n + missing_rows.rn - 1)::text, 3, '0') AS template_key,
    jsonb_build_object('en', missing_rows.pattern) AS code,
    missing_rows.level,
    missing_rows.tense
FROM missing_rows
CROSS JOIN prefix
ON CONFLICT (template_key) DO NOTHING;

-- 3) REQUEST_ACTION + IMPERATIVE
WITH
prefix AS (
    SELECT COALESCE(
               MAX((regexp_replace(template_key, '^RA_IM_(\\d+)$', '\\1'))::int),
               0
           ) + 1 AS start_n
    FROM templates
    WHERE template_key ~ '^RA_IM_\\d+$'
),
candidate_rows AS (
    VALUES
        (1, 'VERB_BASE OBJECT', 'A1', 'ANY'),
        (2, 'POLITE_INTRO VERB_BASE OBJECT', 'A1', 'ANY'),
        (3, 'POLITE_INTRO VERB_BASE OBJECT TIME', 'A2', 'ANY'),
        (4, 'POLITE_INTRO VERB_BASE OBJECT PLACE', 'A2', 'ANY')
),
missing_rows AS (
    SELECT
        row_number() OVER (ORDER BY ord) AS rn,
        pattern,
        level,
        tense
    FROM candidate_rows AS c(ord, pattern, level, tense)
    WHERE NOT EXISTS (
        SELECT 1
        FROM templates t
        WHERE t.code = jsonb_build_object('en', c.pattern)
          AND t.level = c.level
          AND t.tense = c.tense
    )
)
INSERT INTO templates (template_key, code, level, tense)
SELECT
    'RA_IM_' || lpad((prefix.start_n + missing_rows.rn - 1)::text, 3, '0') AS template_key,
    jsonb_build_object('en', missing_rows.pattern) AS code,
    missing_rows.level,
    missing_rows.tense
FROM missing_rows
CROSS JOIN prefix
ON CONFLICT (template_key) DO NOTHING;

-- 4) EXPRESS_NEGATION + SIMPLE_NEGATIVE
WITH
prefix AS (
    SELECT COALESCE(
               MAX((regexp_replace(template_key, '^EN_SN_(\\d+)$', '\\1'))::int),
               0
           ) + 1 AS start_n
    FROM templates
    WHERE template_key ~ '^EN_SN_\\d+$'
),
candidate_rows AS (
    VALUES
        (1, 'SUBJECT NEGATIVE_VERB_GROUP', 'A1', 'ANY'),
        (2, 'SUBJECT NEGATIVE_VERB_GROUP OBJECT', 'A1', 'ANY'),
        (3, 'SUBJECT NEGATIVE_VERB_GROUP OBJECT TIME', 'A2', 'ANY'),
        (4, 'SUBJECT NEGATIVE_VERB_GROUP OBJECT PLACE', 'A2', 'ANY')
),
missing_rows AS (
    SELECT
        row_number() OVER (ORDER BY ord) AS rn,
        pattern,
        level,
        tense
    FROM candidate_rows AS c(ord, pattern, level, tense)
    WHERE NOT EXISTS (
        SELECT 1
        FROM templates t
        WHERE t.code = jsonb_build_object('en', c.pattern)
          AND t.level = c.level
          AND t.tense = c.tense
    )
)
INSERT INTO templates (template_key, code, level, tense)
SELECT
    'EN_SN_' || lpad((prefix.start_n + missing_rows.rn - 1)::text, 3, '0') AS template_key,
    jsonb_build_object('en', missing_rows.pattern) AS code,
    missing_rows.level,
    missing_rows.tense
FROM missing_rows
CROSS JOIN prefix
ON CONFLICT (template_key) DO NOTHING;

COMMIT;
