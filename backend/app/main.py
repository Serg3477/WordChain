from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.init_db import init_models

# Роутеры
from app.routers.auth import auth_router as auth_router
from app.routers.saveWord import save_router
from app.routers.translation import translation_router as translation_router
from app.routers.registration import registration_router
from app.routers.login import login_router
from app.routers.delete_user import delete_router

app = FastAPI(
    title="WordChain",
    description="Async backend for translation and vocabulary learning",
    version="1.0.0"
)

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
app.include_router(auth_router)
app.include_router(registration_router)
app.include_router(login_router)
app.include_router(delete_router)
app.include_router(translation_router)
app.include_router(save_router)


