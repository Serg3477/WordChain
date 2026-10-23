import { state } from "../../../core/state.js";
import { windowManager } from "../../../core/windowManager.js"
import { loginUser, googleAuthUser  } from "../../../api/user.js";
import { renderRegister } from "./register.js";
import { getSettings } from "../../../api/settings.js";
import { renderGoogleButton } from "../../../shared/googleIdentity.js";
import { forgotPassword } from "./login/forgotPassword.js";

import { tipModal } from "../../../ui/tipModal/tipModal.js";
import { BaseButton } from "../../../ui/baseButton/baseButton.js";
import { passwordVisible } from "../../../shared/passwordVisible.js";
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
            <form class="user-form" name="login" novalidate>
                <label class="ui-label" for="login-email">${t("login", "input_email")}</label>
                <input class="input-word" type="email" name="email" required placeholder="you@example.com" autocomplete="email">

                <label class="ui-label" for="login-pass">${t("login", "input_password")}</label>
                <div class="password-input-container">
                    <input id="login-pass" class="input-word" type="password" name="password" required placeholder="••••••••" autocomplete="current-password">
                    <div class="password-button-container"></div>
                </div>

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

    const emailInput = formLog.elements.email;
    const passwordInput = formLog.elements.password;
    const passwordButtonContainer = formLog.querySelector(".password-button-container");
    const forgotPasswordLink =
        formLog.querySelector('[data-action="forgot-password"]');

    passwordVisible(
        passwordInput,
        passwordButtonContainer
    );

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

    submitSlot.appendChild(loginAccountBtn);

    renderGoogleButton({
        slot: googleSlot,
        flow: "login",
        text: "signin_with",
        locale: state.userInterface.ui_language || "en",

        onCredential: async (response) => {
            logInfo("Google login credential received");
            try {
                const res = await googleAuthUser({
                    credential: response.credential,
                    mode: "login",
                    terms_accepted: false
                });

                // Очень важно сначала удалить старые токены.
                localStorage.removeItem("token");
                sessionStorage.removeItem("token");

                if (formLog.remember_me.checked) {
                    localStorage.setItem("token", res.token);
                } else {
                    sessionStorage.setItem( "token", res.token);
                }

                state.setUser({
                    id: res.id,
                    nickname: res.nickname,
                    avatar_url: res.avatar_url,
                    email: res.email,
                    token: res.token,
                    is_guest: res.is_guest,
                    is_premium: res.is_premium
                });

                // Settings
                try {
                    const settings = await getSettings({
                        endpoint: "/get_settings",
                        method: "POST",
                        user_id: res.id
                    });
                    if (settings) {
                        state.setLanguages(
                            settings.input_lang,
                            settings.output_lang
                        );
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
                } catch (settingsError) {
                    logError("Google login settings load failed", {error: settingsError.message});
                }
                windowManager.pushScreen("translator");
                Notification.show({type: "success", message: t("login", "notification_success") });

            } catch (e) {
                if (e.detail === "google_account_not_found") {
                    Notification.show({type: "warning", message: t("login", "google_account_not_found" )});
                    return;
                }
                if (e.detail === "invalid_google_token") {
                    Notification.show({type: "error",  message: t("login", "google_auth_error" ) });
                    return;
                }
                logError("Google login failed", {error: e.message, detail: e.detail} );
            }
        }
    }).catch((e) => {
        logError("Google login button render failed", { error: e.message });
    });

    formLog.addEventListener("submit", async (event) => {
        logInfo("Login submit fired");
        event.preventDefault();
        
        // EMAIL не заполнен
        if (!emailInput.value.trim()) {
            await tipModal({
                text: t("login", "email_required"),
                mode: "error",
                target: emailInput
            });
            return;
        }

        // PASSWORD не заполнен
        if (!passwordInput.value) {
            await tipModal({
                text: t("login", "password_required"),
                mode: "error",
                target: passwordInput
            });
            return;
        }

        const data = { email: formLog.email.value, password: formLog.password.value, remember_me: formLog.remember_me.checked };

        try {
            const res = await loginUser(data);

            localStorage.removeItem("token");
            sessionStorage.removeItem("token");

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
            windowManager.pushScreen("translator");
            Notification.show({ type: "success", message: t("login", "notification_success")});

        } catch (e) {
            // EMAIL неверный
            if (e.detail === "invalid_email") {
                await tipModal({
                    text: t("login", "invalid_email"),
                    mode: "error",
                    target: emailInput
                });
                return;
            }
            // PASSWORD неверный
            if (e.detail === "invalid_password") {
                await tipModal({
                    text: t("login", "invalid_password"),
                    mode: "error",
                    target: passwordInput
                });
                return;
            }

            logError("Login request failed", {
                error: e.message
            });
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
            // Notification.show({ type: "success", message: t("login", "notification_success")});
            return settings;
        } catch (e) {
            logError("Fetch settings failed - components/login.js /get_settings", { error: e.message });
            return null;
        }

    });
    forgotPasswordLink.addEventListener("click", async () => {
        logInfo("Forgot password clicked");
        const emailPlaceholder =  emailInput.value;
        const res = await forgotPassword(emailPlaceholder, emailInput);
    });

}
// подписки на изменения языков
state.on("interface", () => {
    const screen =
        document.querySelector('[data-screen="login"]');

    if (
        screen &&
        screen.style.display !== "none"
    ) {
        renderLogin(state);
    }
});