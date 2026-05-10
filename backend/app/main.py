from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.db.init_db import init_models
from app.logger.logger import backend_logger
from app.logger.logging_intercept import setup_sqlalchemy_logging


# Роутеры
from app.routers.auth import auth_router as auth_router
from app.routers.save_word import save_router
from app.routers.translation import translation_router as translation_router
from app.routers.registration import registration_router
from app.routers.login import login_router
from app.routers.delete_user import delete_router
from app.routers.logs import logs_router

app = FastAPI(
    title="WordChain",
    description="Async backend for translation and vocabulary learning",
    version="1.0.0"
)

@app.get("/")
async def root():
    backend_logger.info("Root endpoint called")
    return {"status": "ok", "message": "WordChain backend is running"}


@app.on_event("startup")
async def on_startup():
    await init_models()

# -----------------------------
# CORS (для фронтенда)
# -----------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # на проде лучше указать домен
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# Подключение роутеров
# -----------------------------
app.include_router(logs_router)
app.include_router(auth_router)
app.include_router(registration_router)
app.include_router(login_router)
app.include_router(delete_router)
app.include_router(translation_router)
app.include_router(save_router)

# Логирование операций SQLAlchemy
@app.middleware("http")
async def log_requests(request: Request, call_next):
    backend_logger.info(f"Incoming request: {request.method} {request.url}")

    try:
        response = await call_next(request)
    except Exception as e:
        backend_logger.exception(f"Unhandled error: {e}")
        raise

    backend_logger.info(f"Response status: {response.status_code}")
    return response

# Логирование SQLAlchemy SQL-запросов
# setup_sqlalchemy_logging()
