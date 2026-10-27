from fastapi import APIRouter
from app.schemas.quizes import SentencesQuizRequest, SentencesQuizResponse
from app.services.quizes_service import quiz_sentence
from logger.logger import backend_logger



sentences_quiz_router = APIRouter()

@sentences_quiz_router.post("/quiz_sentence", response_model=SentencesQuizResponse)
async def get_quiz_sentence(req: SentencesQuizRequest):
    backend_logger.info(f"Request Quiz Sentence attempt")

    result = await quiz_sentence(req)
    backend_logger.info(f"Request Quiz Sentence success")

    return SentencesQuizResponse(**result)

