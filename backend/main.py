import os
from datetime import datetime, timedelta, timezone
from pathlib import Path

import jwt
from dotenv import load_dotenv

from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field
from pwdlib import PasswordHash

from database import get_connection, init_db


# Настройки безопасности
password_hash = PasswordHash.recommended()

# Загружаем переменные из файла .env
load_dotenv(Path(__file__).resolve().parent / ".env")

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY не найден в файле .env")

def create_access_token(user_id: int):
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload = {
        "sub": str(user_id),
        "exp": expire
    }

    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

class RegistrationRequest(BaseModel):
    username: str = Field(min_length=3, max_length=30)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

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

@app.post("/api/register", status_code=201)
def register_user(user: RegistrationRequest):
    connection = get_connection()

    try:
        # Проверяем, существует ли пользователь с таким именем или email
        existing_user = connection.execute(
            """
            SELECT id FROM users
            WHERE username = ? OR email = ?
            """,
            (user.username, user.email)
        ).fetchone()

        if existing_user:
            raise HTTPException(
                status_code=409,
                detail="Пользователь с таким именем или email уже существует"
            )

        # Хешируем пароль перед сохранением
        hashed_password = password_hash.hash(user.password)

        # Добавляем пользователя в базу данных
        cursor = connection.execute(
            """
            INSERT INTO users (username, email, password_hash)
            VALUES (?, ?, ?)
            """,
            (user.username, user.email, hashed_password)
        )

        connection.commit()

        return {
            "message": "Регистрация прошла успешно",
            "user_id": cursor.lastrowid,
            "username": user.username
        }

    finally:
        connection.close()


@app.post("/api/login")
def login_user(user: LoginRequest):
    connection = get_connection()

    try:
        # Ищем пользователя по email
        existing_user = connection.execute(
            """
            SELECT id, username, email, password_hash
            FROM users
            WHERE email = ?
            """,
            (user.email,)
        ).fetchone()

        # Проверяем существование пользователя и пароль
        if existing_user is None or not password_hash.verify(
            user.password,
            existing_user["password_hash"]
        ):
            raise HTTPException(
                status_code=401,
                detail="Неверный email или пароль"
            )

        # Создаём JWT-токен
        access_token = create_access_token(existing_user["id"])

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user_id": existing_user["id"],
            "username": existing_user["username"]
        }

    finally:
        connection.close()