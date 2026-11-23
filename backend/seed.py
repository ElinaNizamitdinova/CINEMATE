
from database import get_connection


items = [
    {
        "title": "Interstellar",
        "item_type": "movie",
        "release_year": 2014,
        "genres": "Фантастика, Драма, Приключения",
        "description": "Путешествие группы исследователей через червоточину в поисках нового дома для человечества."
    },
    {
        "title": "Inception",
        "item_type": "movie",
        "release_year": 2010,
        "genres": "Фантастика, Боевик, Триллер",
        "description": "Профессиональный вор проникает в сны людей, чтобы похищать информацию."
    },
    {
        "title": "The Shawshank Redemption",
        "item_type": "movie",
        "release_year": 1994,
        "genres": "Драма",
        "description": "История дружбы и надежды двух заключённых в тюрьме Шоушенк."
    },
    {
        "title": "The Green Mile",
        "item_type": "movie",
        "release_year": 1999,
        "genres": "Драма, Фэнтези, Криминал",
        "description": "История надзирателя тюрьмы и необычного заключённого с удивительным даром."
    },
    {
        "title": "Forrest Gump",
        "item_type": "movie",
        "release_year": 1994,
        "genres": "Драма, Мелодрама",
        "description": "Жизненный путь простодушного человека, который становится свидетелем важных исторических событий."
    },
    {
        "title": "The Matrix",
        "item_type": "movie",
        "release_year": 1999,
        "genres": "Фантастика, Боевик",
        "description": "Программист узнаёт, что привычный мир является искусственной реальностью."
    },
    {
        "title": "The Dark Knight",
        "item_type": "movie",
        "release_year": 2008,
        "genres": "Боевик, Криминал, Драма",
        "description": "Бэтмен противостоит Джокеру, который стремится погрузить Готэм в хаос."
    },
    {
        "title": "Pulp Fiction",
        "item_type": "movie",
        "release_year": 1994,
        "genres": "Криминал, Драма",
        "description": "Несколько переплетающихся историй из жизни преступников Лос-Анджелеса."
    },
    {
        "title": "Fight Club",
        "item_type": "movie",
        "release_year": 1999,
        "genres": "Драма, Триллер",
        "description": "Офисный работник знакомится с харизматичным человеком и создаёт подпольный клуб."
    },
    {
        "title": "The Lord of the Rings: The Fellowship of the Ring",
        "item_type": "movie",
        "release_year": 2001,
        "genres": "Фэнтези, Приключения",
        "description": "Начало путешествия хранителя Кольца и его спутников."
    },
    {
        "title": "Breaking Bad",
        "item_type": "series",
        "release_year": 2008,
        "genres": "Криминал, Драма, Триллер",
        "description": "Учитель химии начинает производить наркотики после тяжёлого диагноза."
    },
    {
        "title": "Sherlock",
        "item_type": "series",
        "release_year": 2010,
        "genres": "Детектив, Драма, Криминал",
        "description": "Современная интерпретация историй о Шерлоке Холмсе."
    },
    {
        "title": "Game of Thrones",
        "item_type": "series",
        "release_year": 2011,
        "genres": "Фэнтези, Драма, Приключения",
        "description": "Несколько знатных домов борются за власть над континентом Вестерос."
    },
    {
        "title": "Stranger Things",
        "item_type": "series",
        "release_year": 2016,
        "genres": "Фантастика, Ужасы, Драма",
        "description": "В небольшом городе происходят загадочные события после исчезновения мальчика."
    },
    {
        "title": "The Office",
        "item_type": "series",
        "release_year": 2005,
        "genres": "Комедия",
        "description": "Повседневная жизнь сотрудников офиса, снятая в формате псевдодокументального сериала."
    }
]


connection = get_connection()

try:
    added = 0
    skipped = 0

    for item in items:
        existing = connection.execute(
            """
            SELECT id FROM catalog_items
            WHERE title = ? AND release_year = ?
            """,
            (item["title"], item["release_year"])
        ).fetchone()

        if existing:
            skipped += 1
            continue

        connection.execute(
            """
            INSERT INTO catalog_items
            (title, item_type, release_year, genres, description)
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                item["title"],
                item["item_type"],
                item["release_year"],
                item["genres"],
                item["description"]
            )
        )
        added += 1

    connection.commit()

    print(f"Добавлено записей: {added}")
    print(f"Пропущено (уже существуют): {skipped}")

finally:
    connection.close()
