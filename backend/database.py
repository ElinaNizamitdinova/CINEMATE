import sqlite3
from pathlib import Path


# Путь к файлу базы данных
DATABASE_PATH = Path(__file__).resolve().parent / "cinemate.db"


# Создание подключения к базе данных
def get_connection():

    connection = sqlite3.connect(DATABASE_PATH)

    # Получаем строки в виде объектов с доступом по имени столбца
    connection.row_factory = sqlite3.Row

    # Включаем проверку внешних ключей
    connection.execute("PRAGMA foreign_keys = ON")

    return connection


# Создание таблиц базы данных
def init_db():

    connection = get_connection()

    try:

        connection.executescript("""

            -- Таблица пользователей
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL UNIQUE,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );


            -- Таблица фильмов и сериалов
            CREATE TABLE IF NOT EXISTS catalog_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                item_type TEXT NOT NULL
                    CHECK(item_type IN ('movie', 'series')),
                release_year INTEGER,
                genres TEXT,
                description TEXT,
                poster_url TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );


            -- Таблица пользовательских оценок
            CREATE TABLE IF NOT EXISTS ratings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                item_id INTEGER NOT NULL,
                score INTEGER NOT NULL
                    CHECK(score BETWEEN 1 AND 5),
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,

                UNIQUE(user_id, item_id),

                FOREIGN KEY (user_id)
                    REFERENCES users(id) ON DELETE CASCADE,

                FOREIGN KEY (item_id)
                    REFERENCES catalog_items(id) ON DELETE CASCADE
            );


            -- Таблица списка «Посмотреть позже»
            CREATE TABLE IF NOT EXISTS watchlist (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                item_id INTEGER NOT NULL,
                added_at TEXT DEFAULT CURRENT_TIMESTAMP,

                UNIQUE(user_id, item_id),

                FOREIGN KEY (user_id)
                    REFERENCES users(id) ON DELETE CASCADE,

                FOREIGN KEY (item_id)
                    REFERENCES catalog_items(id) ON DELETE CASCADE
            );


            -- Таблица тематических подборок
            CREATE TABLE IF NOT EXISTS collections (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );


            -- Связующая таблица подборок и фильмов
            CREATE TABLE IF NOT EXISTS collection_items (
                collection_id INTEGER NOT NULL,
                item_id INTEGER NOT NULL,

                PRIMARY KEY (collection_id, item_id),

                FOREIGN KEY (collection_id)
                    REFERENCES collections(id) ON DELETE CASCADE,

                FOREIGN KEY (item_id)
                    REFERENCES catalog_items(id) ON DELETE CASCADE
            );

        """)

        connection.commit()

    finally:
        connection.close()