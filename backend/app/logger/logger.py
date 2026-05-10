from loguru import logger
import os

LOG_DIR = "logs"
os.makedirs(LOG_DIR, exist_ok=True)

# Отдельный файл для логов бэкенда
logger.add(
    f"{LOG_DIR}/backend.log",
    rotation="10 MB",
    retention="10 days",
    compression="zip",
    enqueue=True,
    backtrace=True,
    diagnose=True,
    level="INFO"
)

# Отдельный файл для логов фронтенда
logger.add(
    f"{LOG_DIR}/frontend.log",
    rotation="10 MB",
    retention="10 days",
    compression="zip",
    enqueue=True,
    level="INFO"
)
# Режим - всё в одном файле
# logger.add(
#     "logs/all.log",
#     rotation="10 MB",
#     retention="10 days",
#     compression="zip",
#     enqueue=True,
#     level="INFO"
# )


backend_logger = logger.bind(source="backend")
frontend_logger = logger.bind(source="frontend")
