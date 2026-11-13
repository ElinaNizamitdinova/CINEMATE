// Находим элементы управления каталогом
const searchInput = document.querySelector("#catalog-search");
const genreFilter = document.querySelector("#genre-filter");
const typeFilter = document.querySelector("#type-filter");
const sortFilter = document.querySelector("#sort-filter");

// Находим контейнер с карточками
const movieList = document.querySelector(".movie-list");

// Проверяем наличие необходимых элементов
if (searchInput && genreFilter && typeFilter && sortFilter && movieList) {

    // Получаем все карточки фильмов
    const movieCards = Array.from(
        movieList.querySelectorAll(".movie-card")
    );

    // Запоминаем первоначальный порядок карточек
    movieCards.forEach((card, index) => {
        card.dataset.originalIndex = index;
    });

    // Сообщение, если ничего не найдено
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "catalog-empty";
    emptyMessage.textContent = "По вашему запросу ничего не найдено.";
    emptyMessage.hidden = true;

    movieList.after(emptyMessage);

    // Основная функция обновления каталога
    function updateCatalog() {

        const searchValue = searchInput.value.trim().toLowerCase();
        const selectedGenre = genreFilter.value;
        const selectedType = typeFilter.value;
        const selectedSort = sortFilter.value;

        // Проверяем каждую карточку
        movieCards.forEach(card => {

            const title = card.querySelector("h2")
                ?.textContent.trim().toLowerCase() || "";

            const genres = (card.dataset.genre || "").split(/\s+/);

            const type = card.dataset.type;
            const matchesYear = Number(card.dataset.year);

            const matchesSearch = title.includes(searchValue);

            const matchesGenre =
                selectedGenre === "all" ||
                genres.includes(selectedGenre);

            const matchesType =
                selectedType === "all" ||
                type === selectedType;

            const isVisible =
                matchesSearch && matchesGenre && matchesType;

            card.classList.toggle("is-hidden", !isVisible);
        });

        // Сортируем карточки
        const sortedCards = [...movieCards].sort((a, b) => {

            const titleA = a.querySelector("h2").textContent.trim();
            const titleB = b.querySelector("h2").textContent.trim();

            const yearA = Number(a.dataset.year);
            const yearB = Number(b.dataset.year);

            switch (selectedSort) {

                case "newest":
                    return yearB - yearA;

                case "oldest":
                    return yearA - yearB;

                case "title":
                    return titleA.localeCompare(titleB, "ru");

                default:
                    return Number(a.dataset.originalIndex) -
                           Number(b.dataset.originalIndex);
            }
        });

        // Обновляем порядок карточек на странице
        sortedCards.forEach(card => {
            movieList.appendChild(card);
        });

        // Показываем сообщение, если результатов нет
        const hasResults = movieCards.some(
            card => !card.classList.contains("is-hidden")
        );

        emptyMessage.hidden = hasResults;
    }

    // Отслеживаем изменения поисковой строки
    searchInput.addEventListener("input", updateCatalog);

    // Отслеживаем изменения фильтров
    genreFilter.addEventListener("change", updateCatalog);
    typeFilter.addEventListener("change", updateCatalog);
    sortFilter.addEventListener("change", updateCatalog);

    // Обновляем каталог при открытии страницы
    updateCatalog();
}
// Работа со списком «Посмотреть позже»
const WATCHLIST_KEY = "cinemateWatchlist";

// Получаем сохранённые фильмы
function getSavedMovies() {
    try {
        const movies = JSON.parse(
            localStorage.getItem(WATCHLIST_KEY) || "[]"
        );

        return Array.isArray(movies) ? movies : [];

    } catch (error) {
        console.error("Ошибка чтения списка:", error);
        return [];
    }
}

// Обновляем состояние кнопок
function updateWatchlistButtons() {

    const savedMovies = getSavedMovies();

    document.querySelectorAll(".movie-card").forEach(card => {

        const button = card.querySelector(".add-to-watchlist");

        if (!button) return;

        const movieId = card.dataset.movieId;
        const isSaved = savedMovies.some(
            movie => movie.id === movieId
        );

        button.textContent = isSaved
            ? "Уже в списке"
            : "Добавить в список";

        button.disabled = isSaved;
    });
}

// Обрабатываем нажатия на кнопки добавления
document.querySelectorAll(".movie-card").forEach(card => {

    const button = card.querySelector(".add-to-watchlist");

    if (!button) return;

    button.addEventListener("click", function () {

        const savedMovies = getSavedMovies();

        const movie = {
            id: card.dataset.movieId,
            title: card.querySelector("h2").textContent.trim(),
            year: card.dataset.year,
            genre: card.querySelector("p").textContent
                .split("·").slice(1).join("·").trim(),
            image: card.querySelector("img").getAttribute("src")
        };

        // Проверяем, не добавлен ли фильм ранее
        if (savedMovies.some(item => item.id === movie.id)) {
            button.textContent = "Уже в списке";
            button.disabled = true;
            return;
        }

        // Добавляем фильм в список
        savedMovies.push(movie);

        try {
            localStorage.setItem(
                WATCHLIST_KEY,
                JSON.stringify(savedMovies)
            );

            button.textContent = "Добавлено в список";
            button.disabled = true;

        } catch (error) {
            console.error("Не удалось сохранить фильм:", error);
            button.textContent = "Ошибка сохранения";
        }
    });
});

// Проверяем состояние кнопок при открытии каталога
updateWatchlistButtons();
// Предотвращаем стандартную отправку формы фильтрации
const catalogFilterForm = document.querySelector("#catalog-filter-form");

if (catalogFilterForm) {
    catalogFilterForm.addEventListener("submit", function (event) {
        event.preventDefault();
    });
}