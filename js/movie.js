
const movieInfo = document.querySelector(".movie-info");
const addButton = document.querySelector("#add-to-watchlist");
const ratingForm = document.querySelector("#rating-form");
const ratingMessage = document.querySelector("#rating-message");

// Локальные постеры
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
    "Stranger Things": "stranger-things.jpg",
    "The Lord of the Rings: The Fellowship of the Ring": "lord-of-the-rings.jpg",
    "Game of Thrones": "game-of-thrones.jpg",
    "The Office": "the-office.jpg"
};

// Получаем ID фильма из адресной строки
const params = new URLSearchParams(window.location.search);
const movieId = Number(params.get("id"));

// Основная функция загрузки фильма
async function loadMovie() {
    if (!movieInfo || !addButton || !Number.isInteger(movieId) || movieId <= 0) {
        document.querySelector(".movie-details h1").textContent =
            "Не указан фильм";
        return;
    }

    try {
        // Получаем данные фильма с FastAPI
        const movie = await window.CinemateAPI.request(
            `/catalog/${movieId}`
        );

        const title = document.querySelector(".movie-details h1");
        const poster = movieInfo.querySelector("img");
        const description = movieInfo.querySelector(".movie-description");

        // Обновляем заголовок
        title.textContent = movie.title;
        document.title = `${movie.title} — CINEMATE`;

        // Обновляем постер
        if (posters[movie.title]) {
            poster.src = `images/movies/${posters[movie.title]}`;
            poster.alt = `Постер: ${movie.title}`;
        } else {
            poster.replaceWith(createPosterPlaceholder());
        }

        // Обновляем год и жанры
        const metadata = description.querySelectorAll(":scope > p");

        metadata[0].innerHTML =
            `<strong>Год выпуска:</strong> ${movie.release_year}`;

        metadata[1].innerHTML =
            `<strong>Жанр:</strong> ${movie.genres || "Не указан"}`;

        // Удаляем сведения, которых нет в базе данных
        metadata[2].remove();
        metadata[3].remove();
        metadata[4].remove();

        // Обновляем описание
        const descriptionHeading = description.querySelector("h2");
        const descriptionText = descriptionHeading.nextElementSibling;

        descriptionText.textContent =
            movie.description || "Описание пока отсутствует.";

        // Сохраняем ID текущего фильма
        movieInfo.dataset.movieId = movie.id;

        // Настраиваем кнопку списка просмотра
        addButton.addEventListener("click", addToWatchlist);

        // Настраиваем пользовательскую оценку
        if (ratingForm && ratingMessage) {
            ratingForm.addEventListener("submit", saveRating);
        }

        // Проверяем авторизацию и загружаем пользовательские данные
        if (window.CinemateAPI.isAuthenticated()) {
            await loadUserData(movie.id);
        }

    } catch (error) {
        document.querySelector(".movie-details h1").textContent =
            "Не удалось загрузить фильм";

        console.error("Ошибка загрузки фильма:", error);
    }
}

// Создаём заглушку для отсутствующего постера
function createPosterPlaceholder() {
    const placeholder = document.createElement("div");
    placeholder.className = "poster-placeholder";
    placeholder.textContent = "Постер отсутствует";
    return placeholder;
}

// Загружаем список просмотра и оценки пользователя
async function loadUserData(id) {
    try {
        const [watchlist, ratings] = await Promise.all([
            window.CinemateAPI.request("/watchlist"),
            window.CinemateAPI.request("/ratings")
        ]);

        if (watchlist.some(item => item.id === id || item.item_id === id)) {
            addButton.textContent = "Уже в списке";
            addButton.disabled = true;
        }

        const savedRating = ratings.find(item => item.id === id);

        if (savedRating && ratingForm) {
            const input = ratingForm.querySelector(
                `input[value="${savedRating.score}"]`
            );

            if (input) {
                input.checked = true;
                ratingMessage.textContent =
                    `Ваша оценка: ${savedRating.score} из 5 звёзд`;
            }
        }

    } catch (error) {
        console.error("Не удалось загрузить данные пользователя:", error);
    }
}

// Добавление фильма в список просмотра
async function addToWatchlist() {
    if (!window.CinemateAPI.isAuthenticated()) {
        alert("Для добавления в список просмотра необходимо войти в аккаунт.");
        return;
    }

    addButton.disabled = true;

    try {
        await window.CinemateAPI.request("/watchlist", {
            method: "POST",
            body: JSON.stringify({
                item_id: Number(movieInfo.dataset.movieId)
            })
        });

        addButton.textContent = "Добавлено в список";

    } catch (error) {
        alert(error.message);
        addButton.disabled = false;
    }
}

// Сохранение пользовательской оценки
async function saveRating(event) {
    event.preventDefault();

    if (!window.CinemateAPI.isAuthenticated()) {
        ratingMessage.textContent =
            "Для сохранения оценки необходимо войти в аккаунт.";
        return;
    }

    const selectedRating = ratingForm.querySelector(
        'input[name="rating"]:checked'
    );

    if (!selectedRating) {
        ratingMessage.textContent = "Пожалуйста, выберите оценку.";
        return;
    }

    const score = Number(selectedRating.value);

    try {
        await window.CinemateAPI.request("/ratings", {
            method: "POST",
            body: JSON.stringify({
                item_id: Number(movieInfo.dataset.movieId),
                score: score
            })
        });

        ratingMessage.textContent =
            `Ваша оценка сохранена: ${score} из 5 звёзд`;

    } catch (error) {
        ratingMessage.textContent = error.message;
    }
}

// Запускаем загрузку фильма
loadMovie();
