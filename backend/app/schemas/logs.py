from pydantic import BaseModel

# ---------------------------------------------------------
# 1. DTO для передачи логов из фронтенда в бэкенд
# ---------------------------------------------------------

class FrontendLogs(BaseModel):
    level: str
    message: str
    data: dict | None = None
    timestamp: str

