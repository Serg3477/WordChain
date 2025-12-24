from fastapi import FastAPI
from contextlib import asynccontextmanager


@asynccontextmanager
async def lifespan(app: FastAPI):

    yield
    # можно добавить shutdown-логику

app = FastAPI(
    title="FastAPI Altcoins",
    lifespan=lifespan

