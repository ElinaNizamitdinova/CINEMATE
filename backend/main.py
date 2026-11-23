from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from pwdlib import PasswordHash

from database import get_connection, init_db


password_hash = PasswordHash.recommended()


# Запуск базы данных вместе с сервером
@asynccontextmanager
async def lifespan(app: FastAPI):

    # Создаём таблицы при запуске приложения
    init_db()

    yield


# Создаём приложение CINEMATE API
app = FastAPI(
    title="CINEMATE API",
    description="Серверная часть веб-приложения CINEMATE",
    version="1.0.0",
    lifespan=lifespan
)


# Разрешаем взаимодействие с frontend
origins = [
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    "http://127.0.0.1:8000",
    "http://localhost:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Проверка работоспособности сервера
@app.get("/api/health")
def health_check():

    return {
        "status": "ok",
        "message": "CINEMATE API работает"
    }

@app.get("/api/catalog")
def get_catalog(item_type: str | None = None):
    if item_type not in (None, "movie", "series"):
        raise HTTPException(
            status_code=400,
            detail="Параметр item_type должен быть movie или series"
        )

    connection = get_connection()

    try:
        if item_type is None:
            items = connection.execute(
                """
                SELECT id, title, item_type, release_year,
                       genres, description, poster_url
                FROM catalog_items
                ORDER BY title
                """
            ).fetchall()
        else:
            items = connection.execute(
                """
                SELECT id, title, item_type, release_year,
                       genres, description, poster_url
                FROM catalog_items
                WHERE item_type = ?
                ORDER BY title
                """,
                (item_type,)
            ).fetchall()

        return [dict(item) for item in items]

    finally:
        connection.close()

@app.get("/api/catalog/{item_id}")
def get_catalog_item(item_id: int):
    connection = get_connection()

    try:
        item = connection.execute(
            """
            SELECT id, title, item_type, release_year,
                   genres, description, poster_url
            FROM catalog_items
            WHERE id = ?
            """,
            (item_id,)
        ).fetchone()

        if item is None:
            raise HTTPException(
                status_code=404,
                detail="Фильм или сериал не найден"
            )

        return dict(item)

    finally:
        connection.close()