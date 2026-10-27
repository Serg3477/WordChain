import json

from fastapi import HTTPException

from logger.logger import backend_logger
from utils.openai import _ask_text
from utils.word_helpers import _normalize_lang


async def quiz_sentence(req):
    src = _normalize_lang(req.source_lang, default="auto")


    prompt = (f"""
        You are a professional English grammar exercise generator
        for a language-learning application.
    
        Generate exactly ONE English grammar exercise.
    
        PARAMETERS:
        - Learner CEFR level: {req.level}
        - Source language: {src}
    
        Generate the sentence in the language specified by src.
        This exercise format currently supports English (src="en").
    
        Adapt sentence length, vocabulary, and grammatical complexity
        to the learner's CEFR level.
    
        GRAMMAR COVERAGE:
    
        Select ONE grammatical construction appropriate for the learner's level:
    
        - Present Simple
        - Past Simple
        - Future Simple
        - Present Continuous
        - Past Continuous
        - Future Continuous
        - Present Perfect
        - Past Perfect
        - Future Perfect
        - Present Perfect Continuous
        - Past Perfect Continuous
        - Future Perfect Continuous
        - Passive Voice
    
        Vary grammatical constructions between exercises.
        Use affirmative, negative, and interrogative sentences.
        Do not reveal the selected tense.
    
        SENTENCE RULES:
    
        1. Generate ONE natural and meaningful English sentence.
        2. Replace the auxiliary verb or auxiliary construction with "_________".
        3. Replace the main verb with "_________".
        4. The sentence MUST always contain exactly TWO blanks.
        5. The first blank represents the auxiliary verb or its absence.
        6. The second blank represents the main verb.
        7. Include sufficient context to determine the intended tense.
        8. Avoid ambiguity: only ONE combination of answers must be correct.
        9. Use varied subjects, irregular verbs, and realistic situations.
        10. Do not generate identical or repetitive grammatical examples
            within the same response.
    
        IMPORTANT — SIMPLE TENSES:
    
        Affirmative Present Simple and Past Simple sentences normally
        do not require an auxiliary verb.
    
        In these cases:
        - Keep the first "_________" blank.
        - Set right_answer_auxiliary to "NONE".
        - Include "NONE" among answers_auxiliary.
        - "NONE" means that no auxiliary verb is required.
    
        Example:
        "Yesterday, she _________ _________ an old friend at the station."
    
        Correct auxiliary: "NONE"
        Correct verb: "saw"
    
        Completed sentence:
        "Yesterday, she saw an old friend at the station."
    
        For negative sentences and questions, use the appropriate
        auxiliary verb (do, does, did, etc.).
    
        ANSWER OPTIONS:
    
        answers_auxiliary:
        - Exactly 4 unique strings.
        - Include the correct auxiliary or "NONE".
        - Include 3 plausible but incorrect alternatives.
        - Auxiliary constructions may contain multiple words:
            "has been", "had been", "will have", "will have been", etc.
        - Randomize the correct answer's position.
    
        answers_verb:
        - Exactly 4 unique strings.
        - All options must be grammatical forms of the SAME lexical verb.
        - Include the correct form and 3 plausible incorrect forms.
        - Use base form, Past Simple, Past Participle,
            third-person singular, or -ing form.
        - Use correct irregular verb forms.
        - Choose another verb if fewer than 4 distinct forms exist.
        - Randomize the correct answer's position.
    
        RIGHT ANSWERS:
    
        right_answer_auxiliary:
        - Must exactly match an element of answers_auxiliary.
    
        right_answer_verb:
        - Must exactly match an element of answers_verb.
    
        VALIDATION:
    
        Before returning the result:
    
        1. Verify that the sentence contains exactly two "_________" blanks.
        2. Verify that both answer arrays contain exactly 4 unique strings.
        3. Verify that the correct answers exist in their respective arrays.
        4. Verify that inserting the correct answers produces
            a natural, grammatically correct English sentence.
        5. Verify that no other offered answer combination is equally correct.
        6. Verify that the sentence matches the learner's level: {req.level}.
        7. Verify that the sentence language matches src: {src}.
        8. Verify that the auxiliary blank always comes before
            the main verb blank.
    
        OUTPUT FORMAT:
    
        Return ONLY a valid JSON object with exactly these fields:
    
        {{
            "sentence": "string",
            "answers_auxiliary": ["string", "string", "string", "string"],
            "answers_verb": ["string", "string", "string", "string"],
            "right_answer_auxiliary": "string",
            "right_answer_verb": "string"
        }}
    
        Do not return:
        - Markdown
        - Code fences
        - Explanations
        - Translations
        - Tense names
        - Additional fields
        """
    )

    res = await _ask_text(prompt, max_tokens=2000, reasoning_effort="low")

    print("===== QUIZ AI RESPONSE =====", flush=True)
    print("TYPE:", type(res), flush=True)
    print("VALUE:", repr(res), flush=True)
    print("============================", flush=True)

    if not isinstance(res, str) or not res.strip():
        backend_logger.error("Quiz AI returned empty response")
        raise HTTPException(
            status_code=502,
            detail="AI returned an empty response"
        )

    try:
        result = json.loads(res)
    except (json.JSONDecodeError, TypeError) as e:
        backend_logger.error(f"Quiz AI JSON parsing failed: {e}")
        raise HTTPException(
            status_code=502,
            detail="AI returned invalid JSON"
        ) from e

    return result
