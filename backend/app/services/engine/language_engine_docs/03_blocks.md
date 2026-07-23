# Language Learning Engine — Block Dictionary v1

This is the current controlled vocabulary for template blocks.

The list is not final, but Codex must reuse existing names instead of creating synonyms.

---

## 1. Core participant blocks

### `SUBJECT`

The actor, experiencer, topic, or grammatical subject.

Examples:

```text
I
the manager
my younger brother
the new system
```

### `OBJECT`

A direct object or object phrase.

Examples:

```text
the report
this problem
a new language
the old database
```

### `INDIRECT_OBJECT`

Recipient or beneficiary.

Examples:

```text
me
her colleague
the customer
```

### `COMPLEMENT`

Subject or object complement, especially after linking verbs.

Examples:

```text
happy
a good idea
ready to leave
the best option
```

Use `COMPLEMENT` instead of forcing these values into `OBJECT`.

### `ATTRIBUTE`

An adjective or descriptive attribute used in simpler patterns.

---

## 2. Verb and grammar blocks

### `AFFIRMATIVE_VERB_GROUP`

A complete affirmative verb group.

Examples:

```text
works
is reading
has finished
had been working
will arrive
```

### `NEGATIVE_VERB_GROUP`

A complete negative verb group.

Examples:

```text
does not work
is not reading
has not finished
had not been waiting
will not arrive
```

### `QUESTION_VERB_GROUP`

The question-form verb/auxiliary group used with the subject.

Examples depend on the template and grammar engine:

```text
do
does
did
is
are
has
have
will
can
could
```

Important: permission/modal patterns may require both an auxiliary/modal block and a main verb block. Codex must not “fix” the architecture automatically; flag such cases for review.

### `VERB_GROUP`

Legacy/general complete verb group used by earlier templates.

### `VERB_ING_GROUP`

Legacy continuous-form block used by earlier templates.

### `PASSIVE_GROUP`

A complete passive construction.

Examples:

```text
is built
was repaired
has been completed
will be delivered
```

### `MODAL_GROUP`

A complete modal construction when used as one learning chunk.

Examples:

```text
can help
should leave
might happen
must have forgotten
```

### `VERB_BASE`

Base verb form when the template explicitly separates it from an auxiliary or modal.

### `BE_GROUP`

A form of `be`, possibly with agreement and tense.

### `REPORTING_VERB`

Examples:

```text
said
told me
explained
claimed
suggested
```

---

## 3. Question blocks

### `QUESTION_PHRASE`

Preferred modern name for a question word or multiword question expression.

Examples:

```text
what
where
why
how
how long
how often
what kind of
which one
```

Older templates may still contain `WH_WORD`. A later migration should replace it with `QUESTION_PHRASE`.

### `TAG_QUESTION`

A complete tag question block.

Examples:

```text
isn't it?
don't you?
won't they?
shall we?
right?
```

### `CHOICE_GROUP`

A choice fragment.

Examples:

```text
or tea
or stay at home
either this one or that one
```

### `CHOICE_CLAUSE`

A larger clause expressing a choice.

---

## 4. Time and location blocks

### `TIME`

A time point or general temporal phrase.

Examples:

```text
yesterday
at five o'clock
next week
in 2026
```

### `DURATION`

A duration phrase.

Examples:

```text
for two hours
since Monday
all day
for several weeks
```

### `REFERENCE_POINT`

A reference event or reference time.

Examples:

```text
before she arrived
when the meeting ended
by Friday
before midnight
by the age of thirty
```

This replaces the earlier ideas `BEFORE_EVENT` and `REFERENCE_EVENT`.

### `PLACE`

A location or direction phrase.

### `TEMPORAL_INTRO`

A sentence-initial temporal frame.

Examples:

```text
Yesterday,
During the meeting,
Once upon a time,
By the end of the week,
```

---

## 5. Semantic and clause blocks

These are blocks, not expression strategies.

### `REASON`

A reason phrase.

### `REASON_CLAUSE`

A complete reason clause.

### `PURPOSE`

A purpose phrase.

### `PURPOSE_GROUP`

A fixed purpose construction.

### `PURPOSE_CLAUSE`

A complete purpose clause.

### `RESULT`

A result phrase.

### `RESULT_GROUP`

A result construction.

### `RESULT_CLAUSE`

A complete result clause.

### `CONDITION`

A condition phrase.

### `IF_CLAUSE`

An explicit conditional clause.

### `MAIN_CLAUSE`

The main clause in a conditional pattern.

### `CAUSE_GROUP`

A compact cause construction.

### `CAUSE_CLAUSE`

A complete cause clause.

### `COMPARISON_GROUP`

A compact comparison construction.

### `COMPARISON_CLAUSE`

A full comparison clause.

### `CONTRAST_GROUP`

A compact contrast construction.

### `CONTRAST_CLAUSE`

A full contrast clause.

### `SEQUENCE_GROUP`

A sequence fragment.

### `SEQUENCE_CLAUSE`

A complete sequential clause.

### `RELATIVE_CLAUSE`

A relative clause.

### `THAT_CLAUSE`

A clause introduced by or functioning like “that”.

### `WH_CLAUSE`

An embedded interrogative clause.

### `SECOND_CLAUSE`

A generic second clause used in older templates.

### `CLAUSE`

A generic clause placeholder. Prefer a more specific clause block when possible.

---

## 6. Discourse and fixed-language blocks

### `INTRO`

Generic introductory phrase used in older templates.

### `DISCOURSE_MARKER`

Organizes discourse or signals stance.

Examples:

```text
actually
in fact
to be honest
by the way
as far as I know
on the other hand
```

### `FIXED_EXPRESSION`

A reusable fixed multiword expression.

Examples:

```text
once upon a time
at the end of the day
from my point of view
as a matter of fact
```

### `POLITE_INTRO`

A polite request or imperative introduction.

Examples:

```text
please
kindly
would you please
```

### `EXCLAMATION`

Legacy exclamation block.

Because `EXCLAMATION` is also an expression strategy, a future cleanup may rename this block to:

```text
EXCLAMATION_MARKER
```

Do not rename during bulk population without a migration plan.

### `EMPHASIS_GROUP`

An emphasis construction.

### `ADVERB`

Generic adverb block.

### `MANNER`

Manner phrase.

### `FREQUENCY`

Frequency phrase.

### `AGENT`

Agent phrase in passive constructions.

---

## 7. Phrasal verb blocks

### `PHRASAL_VERB`

A complete phrasal verb.

Examples:

```text
look after
give up
put off
run into
come across
```

### `PHRASAL_OBJECT`

An object pattern compatible with a phrasal verb.

Phrasal verbs must be treated as meaningful chunks and not split into unrelated quiz options unless the lesson explicitly teaches separability.

---

## 8. Naming rules

- Use uppercase snake case.
- Reuse existing terms.
- Do not create synonyms such as `LOCATION` when `PLACE` exists.
- Do not create `WH_WORD` in new templates; use `QUESTION_PHRASE`.
- Do not create `BEFORE_EVENT`; use `REFERENCE_POINT`.
- A block ending in `_GROUP` is normally a compact complete construction.
- A block ending in `_CLAUSE` is normally a complete subordinate or coordinated clause.
- Grammar constructions should remain intact when they are intended as one quiz chunk.
