// Получаем форму обратной связи
const contactForm = document.querySelector("#contact-form");

// Проверяем наличие формы
if (contactForm) {

    // Находим поля формы
    const nameInput = document.querySelector("#name");
    const emailInput = document.querySelector("#email");
    const subjectInput = document.querySelector("#subject");
    const messageInput = document.querySelector("#message");

    // Находим элементы для сообщений об ошибках
    const nameError = document.querySelector("#name-error");
    const emailError = document.querySelector("#email-error");
    const subjectError = document.querySelector("#subject-error");
    const messageError = document.querySelector("#message-error");

    const successMessage = document.querySelector("#form-success");

    // Описываем поля и правила их проверки
    const fields = [
        {
            input: nameInput,
            error: nameError,
            validate: value => {
                if (value.length < 2) {
                    return "Введите имя, состоящее минимум из двух символов.";
                }

                return "";
            }
        },
        {
            input: emailInput,
            error: emailError,
            validate: value => {
                const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

                if (!emailPattern.test(value)) {
                    return "Введите корректный адрес электронной почты.";
                }

                return "";
            }
        },
        {
            input: subjectInput,
            error: subjectError,
            validate: value => {
                if (value.length < 3) {
                    return "Тема должна содержать минимум три символа.";
                }

                return "";
            }
        },
        {
            input: messageInput,
            error: messageError,
            validate: value => {
                if (value.length < 10) {
                    return "Сообщение должно содержать минимум 10 символов.";
                }

                return "";
            }
        }
    ];

    // Проверяем отдельное поле
    function validateField(field) {

        const value = field.input.value.trim();
        const errorText = field.validate(value);

        field.error.textContent = errorText;

        field.input.setAttribute(
            "aria-invalid",
            errorText ? "true" : "false"
        );

        return errorText === "";
    }

    let formSubmitted = false;

    // Обрабатываем отправку формы
    contactForm.addEventListener("submit", function (event) {

        event.preventDefault();

        formSubmitted = true;

        let isValid = true;
        let firstInvalidField = null;

        // Проверяем все поля
        fields.forEach(field => {

            const fieldIsValid = validateField(field);

            if (!fieldIsValid) {
                isValid = false;

                if (!firstInvalidField) {
                    firstInvalidField = field.input;
                }
            }
        });

        // Если есть ошибки, прекращаем обработку
        if (!isValid) {

            successMessage.textContent = "";

            firstInvalidField.focus();

            return;
        }

        // Показываем результат успешной проверки
        successMessage.textContent =
            "Проверка пройдена! Спасибо за сообщение. Отправка появится в ПР3.";
    });

    // Повторно проверяем поле при изменении его содержимого
    fields.forEach(field => {

        field.input.addEventListener("input", function () {

            if (formSubmitted) {
                validateField(field);
                successMessage.textContent = "";
            }
        });
    });
}