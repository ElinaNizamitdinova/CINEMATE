import os
from datetime import datetime, timedelta, timezone
from pathlib import Path

import jwt
from dotenv import load_dotenv

from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field
from pwdlib import PasswordHash

from database import get_connection, init_db


# Настройки безопасности
password_hash = PasswordHash.recommended()
bearer_scheme = HTTPBearer()

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

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)
):
    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )
        user_id = int(payload.get("sub"))
    except (jwt.InvalidTokenError, ValueError, TypeError):
        raise HTTPException(
            status_code=401,
            detail="Недействительный или истёкший токен",
            headers={"WWW-Authenticate": "Bearer"}
        )

    with get_connection() as conn:
        user = conn.execute(
            "SELECT id, username, email FROM users WHERE id = ?",
            (user_id,)
        ).fetchone()

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="Пользователь не найден"
        )

    return user

class RegistrationRequest(BaseModel):
    username: str = Field(min_length=3, max_length=30)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class WatchlistRequest(BaseModel):
    item_id: int = Field(gt=0)

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



@app.get("/api/me")
def read_users_me(current_user = Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "username": current_user["username"],
        "email": current_user["email"]
    }


@app.post("/api/watchlist", status_code=201)
def add_to_watchlist(
    request: WatchlistRequest,
    current_user = Depends(get_current_user)
):
    with get_connection() as conn:
        item = conn.execute(
            "SELECT id FROM catalog_items WHERE id = ?",
            (request.item_id,)
        ).fetchone()

        if item is None:
            raise HTTPException(
                status_code=404,
                detail="Фильм или сериал не найден"
            )

        existing = conn.execute(
            "SELECT id FROM watchlist WHERE user_id = ? AND item_id = ?",
            (current_user["id"], request.item_id)
        ).fetchone()

        if existing:
            raise HTTPException(
                status_code=409,
                detail="Эта запись уже есть в списке"
            )

        conn.execute(
            "INSERT INTO watchlist (user_id, item_id) VALUES (?, ?)",
            (current_user["id"], request.item_id)
        )

    return {
        "message": "Добавлено в список «Посмотреть позже»",
        "item_id": request.item_id
    }

@app.get("/api/watchlist")
def get_watchlist(current_user = Depends(get_current_user)):
    with get_connection() as conn:
        items = conn.execute(
            """
            SELECT
                catalog_items.id,
                catalog_items.title,
                catalog_items.item_type,
                catalog_items.release_year,
                catalog_items.genres,
                catalog_items.poster_url,
                watchlist.added_at
            FROM watchlist
            JOIN catalog_items
                ON watchlist.item_id = catalog_items.id
            WHERE watchlist.user_id = ?
            ORDER BY watchlist.added_at DESC
            """,
            (current_user["id"],)
        ).fetchall()

    return [dict(item) for item in items]

@app.delete("/api/watchlist/{item_id}")
def remove_from_watchlist(
    item_id: int,
    current_user = Depends(get_current_user)
):
    with get_connection() as conn:
        result = conn.execute(
            "DELETE FROM watchlist WHERE user_id = ? AND item_id = ?",
            (current_user["id"], item_id)
        )

        if result.rowcount == 0:
            raise HTTPException(
                status_code=404,
                detail="Запись не найдена в вашем списке"
            )

    return {
        "message": "Удалено из списка «Посмотреть позже»",
        "item_id": item_id
    }

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