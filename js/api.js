// Адрес внешнего API
const API_URL = "https://api.tvmaze.com/singlesearch/shows?q=";

// Находим элементы страницы
const loadingMessage = document.querySelector("#api-loading");
const showContainer = document.querySelector("#api-show-list");
const errorMessage = document.querySelector("#api-error");

// Проверяем наличие необходимых элементов
if (loadingMessage && showContainer && errorMessage) {

    // Список сериалов для загрузки
    const showNames = [
        "breaking bad",
        "sherlock",
        "stranger things"
    ];

    // Создаём карточку сериала
    function createShowCard(show) {

        const card = document.createElement("article");
        card.className = "movie-card";

        // Постер
        if (show.image && show.image.medium) {

            const image = document.createElement("img");

            image.src = show.image.medium;
            image.alt = `Постер сериала ${show.name}`;

            card.appendChild(image);
        }

        // Название
        const title = document.createElement("h3");
        title.textContent = show.name;

        // Год выпуска
        const year = show.premiered
            ? new Date(show.premiered + "T00:00:00").getFullYear()
            : "Год неизвестен";

        // Жанры
        const genres = show.genres.length > 0
            ? show.genres.join(", ")
            : "Жанр не указан";

        const description = document.createElement("p");
        description.textContent = `${year} · ${genres}`;

        // Рейтинг
        const rating = document.createElement("p");

        rating.textContent = show.rating.average !== null
            ? `Рейтинг TVmaze: ${show.rating.average} / 10`
            : "Рейтинг пока отсутствует";

        // Ссылка на источник
        const link = document.createElement("a");

        link.href = show.url;
        link.textContent = "Подробнее на TVmaze";
        link.target = "_blank";
        link.rel = "noopener noreferrer";

        // Собираем карточку
        card.append(
            title,
            description,
            rating,
            link
        );

        return card;
    }

    // Загружаем сериалы из API
    async function loadShows() {

        try {

            loadingMessage.hidden = false;
            errorMessage.hidden = true;

            showContainer.setAttribute("aria-busy", "true");

            // Выполняем запросы к API
            const requests = showNames.map(async name => {

                const response = await fetch(
                    API_URL + encodeURIComponent(name)
                );

                // Проверяем статус ответа
                if (!response.ok) {
                    throw new Error(
                        `Ошибка сервера: ${response.status}`
                    );
                }

                // Получаем данные в формате JSON
                return await response.json();
            });

            // Ждём завершения всех запросов
            const shows = await Promise.all(requests);

            // Создаём карточки
            shows.forEach(show => {

                const card = createShowCard(show);

                showContainer.appendChild(card);
            });

        } catch (error) {

            console.error("Ошибка загрузки сериалов:", error);

            errorMessage.hidden = false;

        } finally {

            // Завершаем состояние загрузки
            loadingMessage.hidden = true;

            showContainer.setAttribute("aria-busy", "false");
        }
    }

    // Запускаем загрузку
    loadShows();
}