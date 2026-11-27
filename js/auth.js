
// Находим формы и сообщения
const registerForm = document.querySelector("#register-form");
const loginForm = document.querySelector("#login-form");

const registerMessage = document.querySelector("#register-message");
const loginMessage = document.querySelector("#login-message");

// Регистрация пользователя
registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    registerMessage.textContent = "Выполняется регистрация...";

    const username = document.querySelector("#register-username").value.trim();
    const email = document.querySelector("#register-email").value.trim();
    const password = document.querySelector("#register-password").value;

    try {
        await window.CinemateAPI.request("/register", {
            method: "POST",
            body: JSON.stringify({
                username,
                email,
                password
            })
        });

        registerMessage.textContent =
            "Регистрация прошла успешно! Теперь вы можете войти.";

        registerForm.reset();

    } catch (error) {
        registerMessage.textContent =
            `Ошибка регистрации: ${error.message}`;
    }
});

// Вход пользователя
loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    loginMessage.textContent = "Выполняется вход...";

    const email = document.querySelector("#login-email").value.trim();
    const password = document.querySelector("#login-password").value;

    try {
        const data = await window.CinemateAPI.request("/login", {
            method: "POST",
            body: JSON.stringify({
                email,
                password
            })
        });

        window.CinemateAPI.saveToken(data.access_token);

        loginMessage.textContent = "Вход выполнен успешно!";

        loginForm.reset();

        setTimeout(() => {
            window.location.href = "catalog.html";
        }, 1000);

    } catch (error) {
        loginMessage.textContent =
            `Ошибка входа: ${error.message}`;
    }
});
// Выход из аккаунта
const logoutLink = document.querySelector("#logout-link");

if (logoutLink) {
    logoutLink.addEventListener("click", event => {
        event.preventDefault();
        window.CinemateAPI.logout();
    });
}