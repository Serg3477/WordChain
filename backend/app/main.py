
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Роутеры
from app.routers.auth import auth_router as auth_router
from app.routers.translation import translation_router as translation_router

app = FastAPI(
    title="WordChain",
    description="Async backend for translation and vocabulary learning",
    version="1.0.0"
)

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
app.include_router(auth_router)
app.include_router(translation_router)

# -----------------------------
# Тестовый эндпоинт
# -----------------------------
@app.get("/")
async def root():
    return {"status": "ok", "message": "WordChain backend is running"}

