// Ключ локального хранилища
const WATCHLIST_KEY = "cinemateWatchlist";

// Находим элементы страницы
const watchlistContainer = document.querySelector("#watchlist-container");
const emptyMessage = document.querySelector("#watchlist-empty");

// Проверяем наличие необходимых элементов
if (watchlistContainer && emptyMessage) {

    // Получаем сохранённые фильмы
    function getWatchlist() {
        try {
            const savedMovies = JSON.parse(
                localStorage.getItem(WATCHLIST_KEY) || "[]"
            );

            return Array.isArray(savedMovies) ? savedMovies : [];

        } catch (error) {
            console.error("Ошибка чтения списка:", error);
            return [];
        }
    }

    // Создаём карточку фильма
    function createMovieCard(movie) {

        const article = document.createElement("article");
        article.className = "movie-card";

        const image = document.createElement("img");
        image.src = movie.image;
        image.alt = `Постер фильма ${movie.title}`;

        const title = document.createElement("h2");
        title.textContent = movie.title;

        const description = document.createElement("p");
        description.textContent = `${movie.year} · ${movie.genre}`;

        const detailsLink = document.createElement("a");
        detailsLink.href = "movie.html";
        detailsLink.textContent = "Подробнее";

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.className = "remove-button";
        removeButton.dataset.movieId = movie.id;
        removeButton.textContent = "Убрать из списка";

        article.append(
            image,
            title,
            description,
            detailsLink,
            removeButton
        );

        return article;
    }

    // Отображаем сохранённые фильмы
    function renderWatchlist() {

        const movies = getWatchlist();

        watchlistContainer.innerHTML = "";

        movies.forEach(movie => {
            const card = createMovieCard(movie);
            watchlistContainer.appendChild(card);
        });

        // Показываем сообщение, если список пуст
        watchlistContainer.hidden = movies.length === 0;
        emptyMessage.hidden = movies.length > 0;
    }

    // Удаляем фильм из списка
    watchlistContainer.addEventListener("click", function (event) {

        const removeButton = event.target.closest(".remove-button");

        if (!removeButton) {
            return;
        }

        const movieId = removeButton.dataset.movieId;

        const updatedMovies = getWatchlist().filter(
            movie => movie.id !== movieId
        );

        localStorage.setItem(
            WATCHLIST_KEY,
            JSON.stringify(updatedMovies)
        );

        renderWatchlist();
    });

    // Показываем список при открытии страницы
    renderWatchlist();
}