import { state } from "../../../core/state.js";
import { windowManager } from "../../../core/windowManager.js"
import { loginUser } from "../../../api/user.js";
import { registerUser } from "../../../api/user.js";
import { renderRegister } from "./register.js";
import { getSettings } from "../../../api/settings.js";

import { BaseButton } from "../../../ui/baseButton/baseButton.js";
import { EraseInputButton } from "../../../ui/erase/eraseInputButton.js";
import { Notification } from "../../../ui/notificationModal/notificationModal.js";
import { logInfo, logError } from "../../../utils/logger/logger.js";
import { t } from "../../../shared/i18n/index.js"



export function renderLogin(state) {
    logInfo("Login screen render start");
    const screen = document.querySelector('[data-screen="login"]');
    logInfo("Login screen node", { found: !!screen });
    if (!screen) {
        logError("Login screen not found");
        return;
    }
    screen.innerHTML = `
   
        <h3 class="ui-title">Sign in</h3>
            
        <div class="user-body">
            <!-- EMAIL LOGIN FORM -->
            <form class="user-form" name="login">
                <label class="ui-label" for="login-email">${t("login", "input_email")}</label>
                <input class="input-word" type="email" name="email" required placeholder="you@example.com" autocomplete="email">

                <label class="ui-label" for="login-pass">${t("login", "input_password")}</label>
                <input class="input-word" type="password" name="password" required placeholder="••••••••" autocomplete="current-password">

                <div class="login-row">
                    <label class="ui-checkbox">
                        <input type="checkbox" name="remember_me">
                        <span>${t("login", "remember_me")}</span>
                    </label><br>

                    <a class="ui-user-link" data-action="forgot-password">${t("login", "forgot_password")}</a>
                </div>

                <div class="login-submit-slot">

                </div>
            </form>

            <div class="divider">
                <span>or</span>
            </div>

            <div class="login-google-slot">
        
            </div>
        </div><br>

        <div class="modal-footer">
            <span>${t("login", "dont_have_account")}</span>
            <a class="ui-user-link" data-action="open-register">${t("login", "create_one")}</a>
        </div>
    `;


    const formLog = screen.querySelector('form[name="login"]');
    logInfo("Login form node", { found: !!formLog });
    if (!formLog) {
        logError("Login form not found");
        return;
    };

    // клик по ссылке - переход на регистрацию
    const link = document.querySelector('[data-action="open-register"]');

    if (link) {
        link.addEventListener("click", () => {
            windowManager.pushScreen("register");
            renderRegister(state);
        });
    };

    const submitSlot = screen.querySelector(".login-submit-slot");
    const googleSlot = screen.querySelector(".login-google-slot");

    const loginAccountBtn = new BaseButton({
        label: t("login", "login_btn"),
        type: "ui-user-btn",
        icon: "",
        action: "click",
        handler: () => {
            logInfo("Login button clicked");
            formLog.requestSubmit() // запускает submit-listener формы
        }
    }).render();

    const googleBtn = new BaseButton({
        label: t("login", "google_btn"),
        type: "ui-user-btn oauth-btn",
        icon: `<img src="./assets/icons/google.png">`,
        action: "click",
        handler: () => {
            logInfo("Login with Google button clicked");
            console.log("Google auth click");
        }
    }).render();

    submitSlot.appendChild(loginAccountBtn);
    googleSlot.appendChild(googleBtn);

    formLog.addEventListener("submit", async (event) => {
        logInfo("Login submit fired");
        event.preventDefault();
        if (!formLog.reportValidity()) {
            logError("Login validation failed", { reason: "reportValidity_false" });
            throw new Error ('Lost reportValidity');
            return
        }
        const data = { email: formLog.email.value, password: formLog.password.value, remember_me: formLog.remember_me.checked };
        try {
            const res = await loginUser(data);
        
            if (formLog.remember_me.checked) localStorage.setItem("token", res.token)
            else sessionStorage.setItem("token", res.token);
            state.setUser({
                id: res.id,
                nickname: res.nickname,
                avatar_url: res.avatar_url,
                email: res.email,
                token: res.token,
                is_guest: res.is_guest,
                is_premium: res.is_premium
            });
            windowManager.back();
            Notification.show({ type: "success", message: t("login", "notification_success")});
        } catch (e) {
            logError("Login request failed", { error: e.message });
            return;
        };

        // Запрос settings залогиненного юзера
        try {
            const settings = await getSettings({
                endpoint: "/get_settings",
                method: "POST",
                user_id: state.user.id
            });
            logInfo("Settings loaded - components/login.js /get_settings", { keys: Object.keys(settings || {}) });

            if (settings) {
                logInfo("Settings loaded and set into state - components/login.js setLanguages");
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
            };
            Notification.show({ type: "success", message: t("login", "notification_success")});
            return settings;
        } catch (e) {
            logError("Fetch settings failed - components/login.js /get_settings", { error: e.message });
            return null;
        };

    });
}
