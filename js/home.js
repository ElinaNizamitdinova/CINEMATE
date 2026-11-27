
// Контейнер главной страницы
const homeMovieList = document.querySelector("#home-movie-list");
const homeCatalogMessage = document.querySelector("#home-catalog-message");

// Названия файлов постеров
const homePosters = {
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

// Создаём карточку фильма или сериала
function createHomeCard(item) {
    const card = document.createElement("article");
    card.className = "movie-card";

    const posterFile = homePosters[item.title];

    if (posterFile) {
        const image = document.createElement("img");
        image.src = `images/movies/${posterFile}`;
        image.alt = `Постер: ${item.title}`;
        card.appendChild(image);
    } else {
        const placeholder = document.createElement("div");
        placeholder.className = "poster-placeholder";
        placeholder.textContent = "Постер отсутствует";
        card.appendChild(placeholder);
    }

    const title = document.createElement("h3");
    title.textContent = item.title;

    const description = document.createElement("p");
    description.textContent =
        `${item.release_year} · ${item.genres || "Жанр не указан"}`;

    const detailsLink = document.createElement("a");
    detailsLink.href = `movie.html?id=${item.id}`;
    detailsLink.textContent = "Подробнее";

    card.append(title, description, detailsLink);

    return card;
}

// Загружаем данные из собственной базы
async function loadHomeCatalog() {
    if (!homeMovieList || !homeCatalogMessage) return;

    try {
        const items = await window.CinemateAPI.request("/catalog");

        homeMovieList.innerHTML = "";

        // Показываем первые шесть записей
        items.slice(0, 6).forEach(item => {
            homeMovieList.appendChild(createHomeCard(item));
        });

        homeCatalogMessage.textContent =
            `Загружено записей: ${Math.min(items.length, 6)}`;

    } catch (error) {
        homeCatalogMessage.textContent =
            `Не удалось загрузить каталог: ${error.message}`;
    }
}

// Запускаем загрузку
loadHomeCatalog();
