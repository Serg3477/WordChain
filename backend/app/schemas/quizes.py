from pydantic import BaseModel, Field
from typing import Optional, List


# -----------------------------
# 2. DTO для запросов предложений
# -----------------------------
class SentencesQuizRequest(BaseModel):
    level: str
    source_lang: str



class SentencesQuizResponse(BaseModel):
    sentence: str
    answers_auxiliary: List[str] = Field(default_factory=list)
    answers_verb: List[str] = Field(default_factory=list)
    right_answer_auxiliary: str
    right_answer_verb: str
