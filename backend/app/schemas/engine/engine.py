from pydantic import BaseModel, Field

# -----------------------------
# 1. DTO для работы engine
# -----------------------------
class EngineRequest(BaseModel):
    level: str
    intent: str
    tense: str
    language: str


class EngineResponse(BaseModel):
    result: str
