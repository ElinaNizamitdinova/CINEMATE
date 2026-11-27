
const watchlistContainer = document.querySelector("#watchlist-container");
const emptyMessage = document.querySelector("#watchlist-empty");

// Названия файлов постеров
const posters = {
    "Interstellar": "interstellar.jpg",
    "Inception": "inception.jpg",
    "The Shawshank Redemption": "shawshank.jpg",
    "The Green Mile": "green-mile.jpg",
    "Forrest Gump": "forrest-gump.jpg",
    "The Matrix": "matrix.jpg",
    "The Dark Knight": "dark-knight.jpg",
    "Pulp Fiction": "pulp-fiction.jpg",
    "Fight Club": "fight-club.jpg",
    "Breaking Bad": "breaking-bad.jpg",
    "Sherlock": "sherlock.jpg",
    "Stranger Things": "stranger-things.jpg"
};

// Создаём карточку фильма
function createMovieCard(movie) {
    const article = document.createElement("article");
    article.className = "movie-card";

    const posterFile = posters[movie.title];

    if (posterFile) {
        const image = document.createElement("img");
        image.src = `images/movies/${posterFile}`;
        image.alt = `Постер: ${movie.title}`;

        article.appendChild(image);
    } else {
        const placeholder = document.createElement("div");
        placeholder.className = "poster-placeholder";
        placeholder.textContent = "Постер отсутствует";

        article.appendChild(placeholder);
    }

    const title = document.createElement("h2");
    title.textContent = movie.title;

    const description = document.createElement("p");
    description.textContent =
        `${movie.release_year} · ${movie.genres || "Жанр не указан"}`;

    const detailsLink = document.createElement("a");
    detailsLink.href = `movie.html?id=${movie.id}`;
    detailsLink.textContent = "Подробнее";

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "remove-button";
    removeButton.dataset.movieId = movie.id;
    removeButton.textContent = "Убрать из списка";

    article.append(
        title,
        description,
        detailsLink,
        removeButton
    );

    return article;
}

// Загружаем список с сервера
async function loadWatchlist() {
    if (!watchlistContainer || !emptyMessage) return;

    if (!window.CinemateAPI.isAuthenticated()) {
        watchlistContainer.hidden = true;
        emptyMessage.hidden = false;
        emptyMessage.textContent = "Чтобы посмотреть список, войдите в аккаунт. ";

        const authLink = document.createElement("a");
        authLink.href = "auth.html";
        authLink.textContent = "Войти";

        emptyMessage.appendChild(authLink);
        return;
    }

    emptyMessage.textContent = "Загружаем список просмотра...";

    try {
        const movies = await window.CinemateAPI.request("/watchlist");

        watchlistContainer.innerHTML = "";

        movies.forEach(movie => {
            watchlistContainer.appendChild(createMovieCard(movie));
        });

        watchlistContainer.hidden = movies.length === 0;
        emptyMessage.hidden = movies.length > 0;

        if (movies.length === 0) {
            emptyMessage.textContent = "Ваш список просмотра пока пуст.";
        }

    } catch (error) {
        watchlistContainer.hidden = true;
        emptyMessage.hidden = false;
        emptyMessage.textContent =
            `Не удалось загрузить список: ${error.message}`;
    }
}

// Удаляем фильм через FastAPI
watchlistContainer.addEventListener("click", async event => {
    const removeButton = event.target.closest(".remove-button");

    if (!removeButton) return;

    const movieId = removeButton.dataset.movieId;

    removeButton.disabled = true;

    try {
        await window.CinemateAPI.request(`/watchlist/${movieId}`, {
            method: "DELETE"
        });

        await loadWatchlist();

    } catch (error) {
        alert(error.message);
        removeButton.disabled = false;
    }
});

// Запускаем загрузку списка
loadWatchlist();
