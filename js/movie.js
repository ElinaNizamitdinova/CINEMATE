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