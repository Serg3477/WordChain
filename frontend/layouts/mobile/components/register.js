import { state } from  "../../../core/state.js";
import { windowManager } from "../../../core/windowManager.js"
import { getSettings, newSettings } from "../../../api/settings.js";
import { registerUser, googleAuthUser } from "../../../api/user.js";
import { renderLogin } from "./login.js";
import { renderGoogleButton } from "../../../shared/googleIdentity.js";

import { BaseButton } from "../../../ui/baseButton/baseButton.js";
import { passwordVisible } from "../../../shared/passwordVisible.js";
import { Notification } from "../../../ui/notificationModal/notificationModal.js";
import { logInfo, logError } from "../../../utils/logger/logger.js";
import { t } from "../../../shared/i18n/index.js"
import { tipModal } from "../../../ui/tipModal/tipModal.js";




export function renderRegister(state) {
    logInfo("Register screen render start");
    const screen = document.querySelector('[data-screen="register"]');
    logInfo("Register screen node", { found: !!screen });
    if (!screen) {
        logError("Register screen not found");
        return;
    }

    screen.innerHTML = `

        <h3 class="ui-title">${t("register", "title")}</h3>

        <div class = "user-body">
            <!-- EMAIL REGISTRATION FORM -->
            <form class="user-form" name="registration" action="/register" novalidate>

                <label class="ui-label">${t("register", "input_name")}</label>
                <input class="input-word" type="text" name="name" required placeholder="or nickname">

                <label class="ui-label">${t("register", "input_email")}</label>
                <input class="input-word" type="email" name="email" required autocomplete="email" placeholder="you@example.com">

                <label class="ui-label">${t("register", "input_password")}</label>
                <div class="password-input-container">
                    <input class="input-word" type="password" name="password" required minlength="8" autocomplete="new-password" placeholder="••••••••">
                    <div class="password-button-container"></div>
                </div>

                <label class="ui-label">${t("register", "input_confirm_password")}</label>
                <div class="password-confirm-container">
                    <input class="input-word" type="password" name="passwordConfirmation" required minlength="8" autocomplete="new-password" placeholder="••••••••">
                    <div class="password-confirm-button-container"></div>
                </div><br>

               <label class="ui-checkbox">
                    <input id="reg-terms" type="checkbox" name="reg-terms">                
                    <span>
                        ${t("register", "terms_agree")}
                        <a href="terms.html" target="_blank" rel="noopener noreferrer" class="terms-link">
                            ${t("register", "terms_of_service")}
                        </a>
                        ${t("register", "terms_and")}
                        <a href="privacy.html" target="_blank" rel="noopener noreferrer" class="terms-link">
                            ${t("register", "privacy_policy")}
                        </a>
                    </span>
                </label>
                <br>

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

    document.querySelectorAll(".terms-link").forEach(link => {
        link.addEventListener("click", (event) => {
            event.stopPropagation();
        });
    });

    const formReg = screen.querySelector('form[name="registration"]');
    logInfo("Register form node", { found: !!formReg });
    if (!formReg) {
        logError("Register form not found");
        return;
    }

    const nameInput = formReg.querySelector('[name="name"]');
    const emailInput = formReg.querySelector('[name="email"]');
    const passwordInput = formReg.querySelector('[name="password"]');
    const passwordConfirm = formReg.querySelector('[name="passwordConfirmation"]');
    const passwordButtonContainer =
            formReg.querySelector(".password-button-container");
    const passwordConfirmButtonContainer =
            formReg.querySelector(".password-confirm-button-container");
    const termsCheckbox = formReg.querySelector("#reg-terms");

    passwordVisible(
        passwordInput,
        passwordButtonContainer
    );
    passwordVisible(
        passwordConfirm,
        passwordConfirmButtonContainer
    );

    // клик по ссылке - переход на регистрацию
    const link = document.querySelector('[data-action="open-login"]');

    if (link) {
        link.addEventListener("click", () => {
            windowManager.pushScreen("login");
            renderLogin(state);
        });
    }

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

    submitSlot.appendChild(createAccountBtn);

    renderGoogleButton({
        slot: googleSlot,
        flow: "register",
        text: "signup_with",
        locale: state.userInterface.ui_language || "en",

        onCredential: async (response) => {
            logInfo("Google register credential received");

            // ВАЖНО:
            // Google registration тоже требует Terms.
            if (!termsCheckbox.checked) {
                await tipModal({
                    text: t(
                        "register",
                        "notification_terms"
                    ),
                    mode: "error",
                    target: termsCheckbox
                });
                return;
            }

            try {
                const res = await googleAuthUser({
                    credential: response.credential,
                    mode: "register",
                    terms_accepted: true
                });

                localStorage.removeItem("token");
                sessionStorage.removeItem("token");

                localStorage.setItem(
                    "token",
                    res.token
                );

                state.setUser({
                    id: res.id,
                    nickname: res.nickname,
                    avatar_url: res.avatar_url,
                    email: res.email,
                    token: res.token,
                    is_guest: res.is_guest,
                    is_premium: res.is_premium
                });

                // Проверяем settings.
                let settings = null;

                try {
                    settings = await getSettings({
                        endpoint: "/get_settings",
                        method: "POST",
                        user_id: res.id
                    });
                } catch (e) {
                    logInfo("Settings not found for Google user");
                }
                // Если Google создал нового пользователя.
                if (!settings) {
                    settings = await newSettings({
                        endpoint: "/new_settings",
                        method: "POST",
                        currentSettings: {
                            user_id: res.id
                        }
                    });
                }
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
                if (res.account_linked) Notification.show({type: "success", message: t("register", "account_linked")});
                else Notification.show({type: "success", message: t("register", "google_success")});
                windowManager.back();
            } catch (e) {
                if (e.detail === "terms_not_accepted") {
                    await tipModal({
                        text: t("register", "notification_terms"),
                        mode: "error",
                        target: termsCheckbox
                    });
                    return;
                }
                logError("Google registration failed", {error: e.message, detail: e.detail});
            }
        }
    }).catch((e) => {
        logError("Google register button render failed", {error: e.message});
    });

    formReg.addEventListener("submit", async (event) => {
        logInfo("Register submit clicked");
        event.preventDefault();

        if (!nameInput.value) {
            await tipModal({
                text: t("register", "name_required"),
                mode: "error",
                target: nameInput
            });
            return;
        }

        if (!emailInput.value) {
            await tipModal({
                text: t("register", "email_required"),
                mode: "error",
                target: emailInput
            });
            return;
        }

        if (!passwordInput.value) {
            await tipModal({
                text: t("register", "password_required"),
                mode: "error",
                target: passwordInput
            });
            return;
        }

        if (!passwordConfirm.value) {
            await tipModal({
                text: t("register", "confirm_password_required"),
                mode: "error",
                target: passwordConfirm
            });
            return;
        }

        if (formReg.password.value !== formReg.passwordConfirmation.value) {
            logError("Register validation failed", {reason: "password_mismatch"});
            Notification.show({type: "warning", message: t("register", "notification_mismatch")});

            await tipModal({
                text: t("register", "notification_mismatch"),
                mode: "error",
                target: passwordConfirm
            });
            return;
        }

        if (!formReg.reportValidity()) {
            Notification.show({type: "error", message: t("register", "notification_error")});
            logError("Register validation failed", {reason: "reportValidity_false"});
            return;
        }

        if (!termsCheckbox.checked) {
            logError("Register validation failed", {reason: "terms_not_accepted"});
            await tipModal({
                text: t("register", "notification_terms"),
                mode: "error",
                target: termsCheckbox
            });
            Notification.show({type: "warning", message: t("register", "notification_terms")});
            return;
        }

        const data = {
            name: formReg.name.value,
            email: formReg.email.value,
            password: formReg.password.value
        };

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

            Notification.show({type: "success", message: t("register", "notification_success")});
            windowManager.back();

        } catch (e) {
            logError("Register request failed", { error: e.message, detail: e.detail });
            if (e.detail === "Email already registered with Google") {
                Notification.show({type: "error", message: t("register", "email_exist_google")});
            }
            if (e.detail === "Email already exists") {
                Notification.show({type: "error", message: t("register", "email_exist")});
            }
            return;
        }

        // создание записи в таблицу settings нового юзера
        try {
            const settings = await newSettings({
                endpoint: "/new_settings",
                method: "POST",
                currentSettings: {
                    user_id: state.user.id
                }
            });
            logInfo("Save new settings for new user: success - components/register.js /new_settings");

            if (settings) {
                logInfo("Settings loaded and set into state - components/register.js setLanguages");

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
        } catch (e) {
            logError(
                "Save new settings request failed in UI - components/register.js /new_settings",
                { error: e.message }
            );
        }
    });
}

// подписки на изменения языков
state.on("interface", () => {
    const screen =
        document.querySelector('[data-screen="register"]');

    if (
        screen &&
        screen.style.display !== "none"
    ) {
        renderRegister(state);
    }
});

