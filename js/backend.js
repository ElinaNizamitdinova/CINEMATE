
// Адрес собственного сервера CINEMATE
const BACKEND_URL = "http://127.0.0.1:8000/api";

// Ключ для хранения JWT-токена
const AUTH_TOKEN_KEY = "cinemateToken";

// Общий объект для работы с сервером
window.CinemateAPI = {

    // Получаем сохранённый токен
    getToken() {
        return localStorage.getItem(AUTH_TOKEN_KEY);
    },

    // Сохраняем токен после входа
    saveToken(token) {
        localStorage.setItem(AUTH_TOKEN_KEY, token);
    },

    // Удаляем токен при выходе
    clearToken() {
        localStorage.removeItem(AUTH_TOKEN_KEY);
    },
    
    // Выход из аккаунта
    logout() {
        this.clearToken();
        window.location.href = "auth.html";
    },

    // Проверяем наличие авторизации
    isAuthenticated() {
        return Boolean(this.getToken());
    },

    // Универсальная функция запросов к FastAPI
    async request(endpoint, options = {}) {

        const headers = {
            ...options.headers
        };

        // Добавляем заголовок JSON, если отправляем тело запроса
        if (options.body && !headers["Content-Type"]) {
            headers["Content-Type"] = "application/json";
        }

        // Добавляем JWT-токен, если пользователь вошёл
        const token = this.getToken();

        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(
            `${BACKEND_URL}${endpoint}`,
            {
                ...options,
                headers
            }
        );

        // Получаем ответ сервера
        let data = null;

        try {
            data = await response.json();
        } catch (error) {
            data = null;
        }

        // Обрабатываем ошибки HTTP
        if (!response.ok) {
            const message =
                data?.detail ||
                data?.message ||
                `Ошибка сервера: ${response.status}`;

            throw new Error(message);
        }

        return data;
    }
};
