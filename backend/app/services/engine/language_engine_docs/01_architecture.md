# Language Learning Engine — Architecture v1

## 1. Purpose

The project is a multilingual language-learning engine that generates structured sentences and quiz exercises from reusable semantic, syntactic, grammatical, and lexical components.

The engine is not intended to generate arbitrary free text. Its main purpose is to produce controlled, explainable, reusable learning material:

- sentence-building quizzes;
- grammar exercises;
- vocabulary activation;
- multilingual sentence patterns;
- progressive difficulty from A1 to C2;
- generation based on a user's learned vocabulary;
- avoidance of repeated exercises;
- future exam and lesson modes.

The engine should prefer explicit, debuggable structures over hidden “smart” behavior.

---

## 2. Core architectural principle

Generation proceeds from meaning to form:

```text
User request
    ↓
Intent
    ↓
Allowed Expression Strategies
    ↓
Allowed Templates
    ↓
Template Blocks
    ↓
Candidate Chunks
    ↓
Scoring / Filtering
    ↓
Sentence
    ↓
Quiz representation
```

Each layer has one responsibility.

### Intent

Defines what the speaker wants to communicate.

Examples:

- `STATE_FACT`
- `DESCRIBE_ACTION`
- `DESCRIBE_EVENT`
- `DESCRIBE_DURATION`
- `DESCRIBE_PLAN`
- `MAKE_PREDICTION`
- `REQUEST_INFORMATION`
- `REQUEST_ACTION`
- `OFFER_HELP`
- `ASK_PERMISSION`
- `EXPRESS_NEGATION`
- `MAKE_COMPARISON`
- `EXPLAIN_CAUSE`
- `EXPRESS_CONDITION`
- `EXPRESS_OPINION`

Additional intents may exist in the live database. Codex must read the database rather than infer missing records.

### Expression Strategy

Defines the form in which the intent is expressed.

Current valid strategy systems after cleanup:

- `SIMPLE_DECLARATIVE`
- `SIMPLE_NEGATIVE`
- `YES_NO_QUESTION`
- `WH_QUESTION`
- `TAG_QUESTION`
- `PASSIVE`
- `MODAL`
- `CONDITIONAL`
- `REPORTED_SPEECH`
- `RELATIVE_CLAUSE`
- `EXCLAMATION`
- `IMPERATIVE`
- `CHOICE`

Semantic relations such as purpose, result, comparison, causation, sequence, contrast, and emphasis were removed from `expression_strategy`. They belong to template/block semantics, not to expression strategy.

### Template

A template is a concrete linear sentence pattern composed of named blocks.

Example:

```text
SUBJECT AFFIRMATIVE_VERB_GROUP OBJECT TIME
```

Another example:

```text
QUESTION_PHRASE QUESTION_VERB_GROUP SUBJECT OBJECT REASON
```

The exact position of every block is explicitly stored in the template.

The engine must not decide dynamically where a block should be inserted unless a future dedicated rule explicitly allows it.

If two valid patterns differ in block order, create two templates.

### Block

A block is a meaningful unit used to assemble a sentence and a quiz step.

A block may contain:

- one word;
- several words;
- a complete grammar group;
- a phrasal verb;
- a fixed expression;
- a clause;
- a discourse marker.

Important rule:

> A grammar construction that should be learned as one unit must remain one block.

Examples:

- `had been working`
- `will have been waiting`
- `has been repaired`
- `should have finished`
- `once upon a time`
- `as far as I know`

The engine must not split such chunks into meaningless quiz fragments.

---

## 3. Explicit templates, not implicit expansion

The project deliberately favors explicit templates.

For example, these are separate templates:

```text
SUBJECT AFFIRMATIVE_VERB_GROUP OBJECT
SUBJECT AFFIRMATIVE_VERB_GROUP OBJECT TIME
SUBJECT AFFIRMATIVE_VERB_GROUP OBJECT PLACE
SUBJECT AFFIRMATIVE_VERB_GROUP OBJECT PLACE TIME
```

Even if `TIME` or `PLACE` could theoretically be optional, the template records:

- whether the block is permitted;
- where the block appears;
- the resulting difficulty;
- the intended learning pattern.

This makes exercises predictable and easier to debug.

---

## 4. Multilingual template model

`templates.code` is JSONB.

English is the mandatory fallback language:

```json
{
  "en": "SUBJECT AFFIRMATIVE_VERB_GROUP OBJECT"
}
```

If another language has the same pattern, its key is omitted.

If another language requires a different order or additional blocks, add only that language:

```json
{
  "en": "QUESTION_PHRASE QUESTION_VERB_GROUP SUBJECT OBJECT",
  "de": "QUESTION_PHRASE QUESTION_VERB_GROUP SUBJECT TIME OBJECT"
}
```

Runtime fallback:

```python
def get_localized_pattern(code: dict, lang: str) -> str:
    return code.get(lang) or code["en"]
```

Do not duplicate identical patterns under all language keys.

Supported language keys:

- `en`
- `ua`
- `ru`
- `de`
- `fr`
- `es`
- `it`
- `pl`

---

## 5. Difficulty

Difficulty belongs to `templates`, not to `intents`.

A single intent may be expressed at any level, while the complexity of the actual pattern varies.

Allowed levels:

```text
A1, A2, B1, B2, C1, C2
```

---

## 6. Tense

`templates.tense` stores the grammar/tense associated with a template.

Examples:

- `PRESENT_SIMPLE`
- `PRESENT_CONTINUOUS`
- `PAST_SIMPLE`
- `PAST_PERFECT_CONTINUOUS`
- `FUTURE_SIMPLE`
- `ANY`
- `MIXED`

For Engine v1, keep `tense` as a string. Do not normalize it into a separate table unless explicitly requested later.

---

## 7. Template identity

Each template has a stable unique key:

```text
<INTENT_PREFIX>_<STRATEGY_PREFIX>_<NUMBER>
```

Examples:

```text
SF_SD_001
RI_WH_003
RA_IM_101
EO_TQ_006
```

`template_key` is for human-readable stable identity.

`id` is only the internal database primary key.

Before inserting templates, Codex must query existing keys and choose unused values. Never rely on memory or assume IDs are consecutive.

---

## 8. Selection flow

The intended selection flow is:

1. Receive request parameters:
   - learning language;
   - interface language;
   - requested grammar/tense;
   - user level;
   - selected or random intent;
   - learned vocabulary;
   - lesson mode.

2. Select an intent.

3. Read allowed expression strategies from `intent_expression_strategy_map`.

4. Select templates linked through `expression_strategy_templates_map`.

5. Filter by:
   - level;
   - tense;
   - language availability/fallback;
   - user history;
   - lesson requirements.

6. Build candidate chunks for each block.

7. Score candidates.

8. Assemble the sentence.

9. Produce:
   - final sentence;
   - translation;
   - ordered quiz blocks;
   - distractors;
   - hints;
   - explanations.

---

## 9. Scoring principle

Do not store a universal static weight on a template.

A score is contextual and should be computed from features such as:

- user level match;
- target tense match;
- learned vocabulary coverage;
- new vocabulary quota;
- recent repetition penalty;
- template repetition penalty;
- block compatibility;
- semantic compatibility;
- linguistic naturalness;
- lesson goals;
- controlled randomness.

Weights belong mainly to candidate selection and scoring logic, not to the template row itself.

---

## 10. Engineering policy for v1

- Finish the explicit template library before large refactors.
- Prefer fewer correct entities over many vaguely defined entities.
- Do not invent intents or strategies that are not in the database.
- Always inspect the live database before generating the next batch.
- Use transactions for batch inserts.
- Use `ON CONFLICT` only when the intended behavior is clear.
- Never silently overwrite existing templates.
- Run duplicate and consistency checks after every batch.
