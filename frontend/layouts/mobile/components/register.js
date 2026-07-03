import { state } from "../../../core/state.js";
import { windowManager } from "../../../core/windowManager.js"
import { newSettings } from "../../../api/settings.js";
import { registerUser } from "../../../api/user.js";
import { renderLogin } from "./login.js";

import { BaseButton } from "../../../ui/baseButton/baseButton.js";
import { EraseInputButton } from "../../../ui/erase/eraseInputButton.js";
import { Notification } from "../../../ui/notificationModal/notificationModal.js";
import { logInfo, logError } from "../../../utils/logger/logger.js";
import { t } from "../../../shared/i18n/index.js"




export function renderRegister(state) {
    logInfo("Register screen render start");
    const screen = document.querySelector('[data-screen="register"]');
    logInfo("Register screen node", { found: !!screen });
    if (!screen) {
        logError("Register screen not found");
        return;
    }

    // подписки на изменения языков и истории слов
    state.on("interface", () => renderRegister());

    screen.innerHTML = `

        <h3 class="ui-title">${t("register", "title")}</h3>

        <div class = "user-body">
            <!-- EMAIL REGISTRATION FORM -->
            <form class="user-form" name="registration" action="/register">

                <label class="ui-label">${t("register", "input_name")}</label>
                <input class="input-word" type="text" name="name" required placeholder="or nickname">

                <label class="ui-label">${t("register", "input_email")}</label>
                <input class="input-word" type="email" name="email" required autocomplete="email" placeholder="you@example.com">

                <label class="ui-label">${t("register", "input_password")}</label>
                <input class="input-word" type="password" name="password" required minlength="8" autocomplete="new-password" placeholder="••••••••">

                <label class="ui-label">${t("register", "input_confirm_password")}</label>
                <input class="input-word" type="password" name="passwordConfirmation" required minlength="8" autocomplete="new-password" placeholder="••••••••"><br>

                <label class="ui-checkbox">
                    <input type="checkbox" name="reg-terms" required>
                    <span>${t("register", "terms_of_service")}</span>
                </label><br>

                <div class="register-submit-slot">
                </div>
            </form>

            <!-- DIVIDER -->
            <div class="divider">
                <span>or</span>
            </div>

            <!-- GOOGLE OAUTH -->
            <div class="register-google-slot">  
            </div>

        </div>
        <br>
        <div class="modal-footer">
            <span>${t("register", "already_have_account")}</span>
            <a class="ui-user-link" data-action="open-login">${t("register", "sign_in_label")}</a>
        </div>
    `;

    const formReg = screen.querySelector('form[name="registration"]');
    logInfo("Register form node", { found: !!formReg });
    if (!formReg) {
        logError("Register form not found");
        return;
    };

    // клик по ссылке - переход на регистрацию
    const link = document.querySelector('[data-action="open-login"]');

    if (link) {
        link.addEventListener("click", () => {
            windowManager.pushScreen("login");
            renderLogin(state);
        });
    };

    const submitSlot = screen.querySelector(".register-submit-slot");
    const googleSlot = screen.querySelector(".register-google-slot");

    const createAccountBtn = new BaseButton({
        label: t("register", "create_account_btn"),
        type: "ui-user-btn",
        icon: "🌐",
        action: "click",
        handler: () => {
            logInfo("Register button clicked");
            formReg.requestSubmit() // запускает submit-listener формы
        }
    }).render();

    const googleBtn = new BaseButton({
        label: t("register", "google_btn"),
        type: "ui-user-btn oauth-btn",
        icon: `<img src="./assets/icons/google.png">`,
        action: "click",
        handler: () => {
            logInfo("Register with Google button clicked");
            console.log("Google auth click");
        }
    }).render();

    submitSlot.appendChild(createAccountBtn);
    googleSlot.appendChild(googleBtn);

    formReg.addEventListener("submit", async (event) => {
        logInfo("Register submit fired");
        event.preventDefault();
        if (formReg.password.value != formReg.passwordConfirmation.value) {
            logError("Register validation failed", { reason: "password_mismatch" });
            Notification.show({ type: "error", message: t("register", "notification_mismatch")});
            throw new Error ('Mismatch Password vc Confirm Password');
            return
        };
        if (!formReg.reportValidity()) {
            logError("Register validation failed", { reason: "reportValidity_false" });
            throw new Error ('Lost reportValidity');
            Notification.show({ type: "error", message: t("register", "notification_error")});
            return
        };
        const data = { name: formReg.name.value, email: formReg.email.value, password: formReg.password.value };
        try {
            const res = await registerUser(data);
            localStorage.setItem("token", res.token);
            state.setUser({
                id: res.id,
                nickname: res.nickname,
                avatar_url: res.avatar_url,
                email: res.email,
                token: res.token,
                is_guest: res.is_guest,
                is_premium: res.is_premium
            });
            Notification.show({ type: "success", message: t("register", "notification_success")})
            windowManager.back();
        } catch (e) {
            logError("Register request failed", { error: e.message });
            return;
        };

        // создание записи в таблицу settings нового юзера
        try {
            const settings = await newSettings({
                endpoint: "/new_settings",
                method: "POST",
                currentSettings: { user_id: state.user.id }
            });
            logInfo("Save new settings for new user: success - components/register.js /new_settings");
            // Сохраняем в state
            if (settings) {
                logInfo("Settings loaded and set into state - components/register.js setLanguages");
                state.setLanguages(settings.input_lang, settings.output_lang);

                state.setUserSkill(
                    settings.user_level,
                    settings.text_size,
                    settings.examples_count
                );

                state.setUserInterface(
                    settings.ui_lang,
                    settings.ui_theme,
                    settings.voice_type
                );
            }
        } catch (e) {
            logError("Save new settings request failed in UI - components/register.js /new_settings", { error: e.message });
        }
    });
} 


