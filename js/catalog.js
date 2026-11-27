
// Находим элементы управления каталогом
const searchInput = document.querySelector("#catalog-search");
const genreFilter = document.querySelector("#genre-filter");
const typeFilter = document.querySelector("#type-filter");
const sortFilter = document.querySelector("#sort-filter");
const movieList = document.querySelector(".movie-list");

// Изображения, которые уже есть в проекте
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

// Сопоставление жанров базы данных со значениями фильтров
const genreCodes = {
    "Фантастика": "sci-fi",
    "Фэнтези": "fantasy",
    "Драма": "drama",
    "Триллер": "thriller",
    "Боевик": "action",
    "Детектив": "detective",
    "Криминал": "crime"
};

// Сообщение о состоянии каталога
const catalogMessage = document.createElement("p");
catalogMessage.className = "catalog-message";

if (movieList) {
    movieList.before(catalogMessage);
}

// Получаем кодированные жанры
function getGenreCodes(genres) {
    return genres
        .split(",")
        .map(genre => genreCodes[genre.trim()])
        .filter(Boolean);
}

// Создаём карточку фильма или сериала
function createMovieCard(item) {
    const card = document.createElement("article");
    card.className = "movie-card";

    const posterFile = posters[item.title];

    const poster = posterFile
        ? `<img src="images/movies/${posterFile}" alt="${item.title}" loading="lazy">`
        : `<div class="poster-placeholder">Постер отсутствует</div>`;

    const genres = item.genres || "";

    card.dataset.movieId = item.id;
    card.dataset.year = item.release_year;
    card.dataset.genre = getGenreCodes(genres).join(" ");
    card.dataset.type = item.item_type;

    card.innerHTML = `
        ${poster}
        <h3>${item.title}</h3>
        <p>${item.release_year} · ${genres}</p>
        <a href="movie.html?id=${item.id}">Подробнее</a>
        <button class="add-to-watchlist" type="button">
            Добавить в список
        </button>
    `;

    const posterImage = card.querySelector("img");

    if (posterImage) {
        posterImage.addEventListener("error", () => {
            const placeholder = document.createElement("div");
            placeholder.className = "poster-placeholder";
            placeholder.textContent = "Постер отсутствует";
            posterImage.replaceWith(placeholder);
        });
    }

    const button = card.querySelector(".add-to-watchlist");

    button.addEventListener("click", async () => {
        if (!window.CinemateAPI.isAuthenticated()) {
            alert("Для добавления в список просмотра необходимо войти в аккаунт.");
            return;
        }

        button.disabled = true;

        try {
            await window.CinemateAPI.request("/watchlist", {
                method: "POST",
                body: JSON.stringify({
                    item_id: item.id
                })
            });

            button.textContent = "Уже в списке";
        } catch (error) {
            alert(error.message);
            button.disabled = false;
        }
    });

    return card;
}

// Фильтрация и сортировка карточек
function updateCatalog() {
    const searchValue = searchInput.value.trim().toLowerCase();
    const selectedGenre = genreFilter.value;
    const selectedType = typeFilter.value;
    const selectedSort = sortFilter.value;

    const cards = Array.from(
        movieList.querySelectorAll(".movie-card")
    );

    cards.forEach(card => {
        const title = card.querySelector("h3").textContent.toLowerCase();
        const genres = (card.dataset.genre || "").split(" ");
        const type = card.dataset.type;

        const matchesSearch = title.includes(searchValue);
        const matchesGenre =
            selectedGenre === "all" || genres.includes(selectedGenre);
        const matchesType =
            selectedType === "all" || type === selectedType;

        card.classList.toggle(
            "is-hidden",
            !(matchesSearch && matchesGenre && matchesType)
        );
    });

    const sortedCards = [...cards].sort((a, b) => {
        const titleA = a.querySelector("h3").textContent;
        const titleB = b.querySelector("h3").textContent;
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
                return 0;
        }
    });

    sortedCards.forEach(card => movieList.appendChild(card));

    const hasResults = cards.some(
        card => !card.classList.contains("is-hidden")
    );

    emptyMessage.hidden = hasResults;
}

// Сообщение, если ничего не найдено
const emptyMessage = document.createElement("p");
emptyMessage.className = "catalog-empty";
emptyMessage.textContent = "По вашему запросу ничего не найдено.";
emptyMessage.hidden = true;

// Загружаем каталог с собственного сервера
async function loadCatalog() {
    if (!movieList) return;

    catalogMessage.textContent = "Загружаем каталог...";

    try {
        const items = await window.CinemateAPI.request("/catalog");

        movieList.innerHTML = "";

        items.forEach(item => {
            movieList.appendChild(createMovieCard(item));
        });

        movieList.after(emptyMessage);

        catalogMessage.textContent = `Загружено записей: ${items.length}`;

        searchInput.addEventListener("input", updateCatalog);
        genreFilter.addEventListener("change", updateCatalog);
        typeFilter.addEventListener("change", updateCatalog);
        sortFilter.addEventListener("change", updateCatalog);

        updateCatalog();

    } catch (error) {
        catalogMessage.textContent =
            `Не удалось загрузить каталог: ${error.message}`;
    }
}

// Отменяем стандартную отправку формы фильтров
const catalogFilterForm = document.querySelector("#catalog-filter-form");

if (catalogFilterForm) {
    catalogFilterForm.addEventListener("submit", event => {
        event.preventDefault();
    });
}

// Запускаем загрузку
if (
    movieList &&
    searchInput &&
    genreFilter &&
    typeFilter &&
    sortFilter
) {
    loadCatalog();
}
