# Language Learning Engine — Conventions and Decisions v1

---

## 1. General working rule

Complete the template library first, then review the whole system.

Do not repeatedly redesign the architecture during population unless a discovered issue would invalidate future data.

---

## 2. Source of truth

The live PostgreSQL database is the source of truth for:

- existing intents;
- existing expression strategies;
- current IDs;
- existing template keys;
- existing mappings;
- actual schema.

Documentation describes intent and conventions, but Codex must inspect the database before making changes.

---

## 3. No invented entities

Never invent a new intent merely because it sounds useful.

Before using an intent, query:

```sql
SELECT id, code->>'system'
FROM intents
ORDER BY id;
```

Before using an expression strategy, query:

```sql
SELECT id, code->>'system'
FROM expression_strategy
ORDER BY id;
```

If an entity is missing, propose it separately. Do not silently create it while inserting templates.

---

## 4. Template keys

Format:

```text
<INTENT_PREFIX>_<STRATEGY_PREFIX>_<NUMBER>
```

Examples:

```text
SF_SD_001
DA_SN_004
RI_WH_007
RA_IM_101
```

Known strategy prefixes:

```text
SD = SIMPLE_DECLARATIVE
SN = SIMPLE_NEGATIVE
YN = YES_NO_QUESTION
WH = WH_QUESTION
TQ = TAG_QUESTION
PS = PASSIVE
MD = MODAL
CD = CONDITIONAL
RP = REPORTED_SPEECH
RC = RELATIVE_CLAUSE
EX = EXCLAMATION
IM = IMPERATIVE
CH = CHOICE
```

Before generating a batch:

```sql
SELECT template_key
FROM templates
WHERE template_key LIKE 'RA_IM_%'
ORDER BY template_key;
```

Choose unused values.

Never resolve a duplicate by blindly changing to a random key. First determine whether the content was already inserted.

---

## 5. JSONB language convention

Minimum:

```json
{
  "en": "SUBJECT AFFIRMATIVE_VERB_GROUP OBJECT"
}
```

Add another language only when the structural pattern differs:

```json
{
  "en": "QUESTION_PHRASE QUESTION_VERB_GROUP SUBJECT OBJECT",
  "de": "QUESTION_PHRASE QUESTION_VERB_GROUP SUBJECT TIME OBJECT"
}
```

Fallback rule:

```python
pattern = code.get(lang) or code["en"]
```

English must always exist.

---

## 6. Linear pattern convention

Template values remain one linear DSL string.

Correct:

```text
SUBJECT AFFIRMATIVE_VERB_GROUP OBJECT TIME
```

Do not replace this with an implicit `core/optional` object.

If a block is permitted in a certain position, include it in a concrete template.

If another placement is valid, create another template.

---

## 7. Difficulty convention

`level` describes the complete template, not the intent.

Use only:

```text
A1 A2 B1 B2 C1 C2
```

Avoid assigning C2 merely because a template contains many blocks. The chosen construction and naturalness matter more than raw length.

---

## 8. Tense convention

For Engine v1, use the existing string column.

Examples:

```text
PRESENT_SIMPLE
PRESENT_CONTINUOUS
PAST_SIMPLE
PAST_PERFECT_CONTINUOUS
FUTURE_SIMPLE
ANY
MIXED
```

Do not create a grammar table during population.

---

## 9. Naturalness over combinatorial completeness

Do not generate every mathematically possible block combination.

Prefer frequent, natural constructions.

A smaller library of high-quality patterns is better than thousands of unnatural patterns.

---

## 10. Chunk integrity

Do not split natural grammar chunks unnecessarily.

Good quiz blocks:

```text
had been working
will have finished
is being repaired
as far as I know
looked after
```

Bad quiz fragmentation:

```text
had
been
working
```

unless the lesson explicitly teaches auxiliary composition.

---

## 11. Legacy names

The database currently contains templates created during evolving design.

Known legacy names:

```text
WH_WORD
VERB_ING_GROUP
VERB_GROUP
QUESTION_GROUP
NEGATION_GROUP
BEFORE_EVENT
REFERENCE_EVENT
EXCLAMATION
```

Do not mix in more variants.

Preferred new names:

```text
QUESTION_PHRASE
AFFIRMATIVE_VERB_GROUP
NEGATIVE_VERB_GROUP
QUESTION_VERB_GROUP
REFERENCE_POINT
```

A separate migration should later normalize legacy names.

---

## 12. Batch insertion discipline

Before insert:

1. Query current keys for the intended prefix.
2. Check the intent exists.
3. Check the strategy exists.
4. Verify the intended mapping.
5. Inspect whether the same code already exists under another key.

Use a transaction.

After insert:

1. Query inserted rows.
2. Validate JSONB.
3. Validate level and tense.
4. Check duplicates.
5. Add mapping rows only after confirming IDs.

---

## 13. Recommended duplicate checks

Duplicate key:

```sql
SELECT template_key, COUNT(*)
FROM templates
GROUP BY template_key
HAVING COUNT(*) > 1;
```

Duplicate structure:

```sql
SELECT code, level, tense, COUNT(*)
FROM templates
GROUP BY code, level, tense
HAVING COUNT(*) > 1;
```

Near-duplicate English pattern:

```sql
SELECT code->>'en' AS pattern, level, tense, COUNT(*)
FROM templates
GROUP BY code->>'en', level, tense
HAVING COUNT(*) > 1;
```

---

## 14. Codex operating instruction

Suggested initial prompt:

```text
Read all files in docs/language_engine_docs.

Then inspect the live PostgreSQL database without modifying it.

Report:
1. actual table schemas;
2. all current intents and expression strategies;
3. all intent-expression mappings;
4. existing template_key ranges;
5. duplicate or inconsistent templates;
6. the next missing natural intent/strategy template batch.

Do not invent intents or strategies.
Do not change data until you show the proposed SQL.
Use English as the mandatory template fallback and add other language keys only when the block order differs.
```

---

## 15. Items intentionally postponed

- normalization of tense;
- merging similar templates;
- migration from legacy block names;
- block type tables;
- chunk candidate tables;
- scoring formulas;
- user history tables;
- response strategies such as short answers;
- automatic multilingual transformation rules.

These should be designed only after the current template library is reviewed.
