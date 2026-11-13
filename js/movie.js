// Ключ для хранения списка в браузере
const WATCHLIST_KEY = "cinemateWatchlist";

// Находим элементы страницы
const movieInfo = document.querySelector(".movie-info");
const addButton = document.querySelector("#add-to-watchlist");

// Проверяем наличие необходимых элементов
if (movieInfo && addButton) {

    // Получаем информацию о текущем фильме
    const movie = {
        id: movieInfo.dataset.movieId,
        title: document.querySelector(".movie-details h1").textContent.trim(),
        year: movieInfo.dataset.year,
        genre: movieInfo.dataset.genre,
        image: movieInfo.querySelector("img").getAttribute("src")
    };

    // Получаем сохранённый список
    function getWatchlist() {
        try {
            const savedMovies = JSON.parse(
                localStorage.getItem(WATCHLIST_KEY) || "[]"
            );

            return Array.isArray(savedMovies) ? savedMovies : [];

        } catch (error) {
            return [];
        }
    }

    // Проверяем, добавлен ли фильм ранее
    if (getWatchlist().some(item => item.id === movie.id)) {
        addButton.textContent = "Уже в списке";
    }

    // Обрабатываем нажатие кнопки
    addButton.addEventListener("click", function () {

        const watchlist = getWatchlist();

        // Не допускаем повторного добавления
        const movieExists = watchlist.some(
            item => item.id === movie.id
        );

        if (movieExists) {
            addButton.textContent = "Уже в списке";
            return;
        }

        // Добавляем фильм
        watchlist.push(movie);

        // Сохраняем обновлённый список
        try {
            localStorage.setItem(
                WATCHLIST_KEY,
                JSON.stringify(watchlist)
            );

            addButton.textContent = "Добавлено в список";

        } catch (error) {
            addButton.textContent = "Не удалось сохранить";
        }
    });
}
// Система пользовательских оценок

const RATING_STORAGE_KEY = "cinemateRatings";

const ratingForm = document.querySelector("#rating-form");
const ratingMessage = document.querySelector("#rating-message");

// Проверяем наличие формы
if (ratingForm && ratingMessage && movieInfo) {

    const movieId = movieInfo.dataset.movieId;

    // Получаем сохранённые оценки
    function getRatings() {
        try {
            const ratings = JSON.parse(
                localStorage.getItem(RATING_STORAGE_KEY) || "{}"
            );

            return ratings && typeof ratings === "object"
                && !Array.isArray(ratings)
                ? ratings
                : {};

        } catch (error) {
            console.error("Ошибка чтения оценок:", error);
            return {};
        }
    }

    // Восстанавливаем предыдущую оценку
    const savedRating = getRatings()[movieId];

    if (savedRating) {
        const savedInput = ratingForm.querySelector(
            `input[value="${savedRating}"]`
        );

        if (savedInput) {
            savedInput.checked = true;
            ratingMessage.textContent =
                `Ваша оценка: ${savedRating} из 5 звёзд`;
        }
    }

    // Обрабатываем отправку формы
    ratingForm.addEventListener("submit", function (event) {

        event.preventDefault();

        const selectedRating = ratingForm.querySelector(
            'input[name="rating"]:checked'
        );

        // Проверяем, выбрана ли оценка
        if (!selectedRating) {
            ratingMessage.textContent = "Пожалуйста, выберите оценку.";
            return;
        }

        const rating = Number(selectedRating.value);

        // Проверяем корректность значения
        if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
            ratingMessage.textContent = "Некорректная оценка.";
            return;
        }

        // Сохраняем оценку
        try {
            const ratings = getRatings();

            ratings[movieId] = rating;

            localStorage.setItem(
                RATING_STORAGE_KEY,
                JSON.stringify(ratings)
            );

            ratingMessage.textContent =
                `Ваша оценка сохранена: ${rating} из 5 звёзд`;

        } catch (error) {
            console.error("Ошибка сохранения оценки:", error);

            ratingMessage.textContent =
                "Не удалось сохранить оценку. Попробуйте ещё раз.";
        }
    });
}