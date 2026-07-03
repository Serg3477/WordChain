import { state } from "../../../core/state.js";
import { windowManager } from "../../../core/windowManager.js"
import { apiRequest } from "../../../core/api.js";
import { registerUser } from "../../../api/user.js";
import { loginUser } from "../../../api/user.js";

import { BaseButton } from "../../../ui/baseButton/baseButton.js";
import { EraseInputButton } from "../../../ui/erase/eraseInputButton.js";

import { Notification } from "../../../ui/notificationModal/notificationModal.js";
import { logInfo, logError } from "../../../utils/logger/logger.js";
import { t } from "../../../shared/i18n/index.js"



export function renderProfile(state) {
    logInfo("Profile screen render start");
    const screen = document.querySelector('[data-screen="profile"]');
    logInfo("Profile screen node", { found: !!screen });
    if (!screen) {
        logError("Profile screen not found");
        return;
    }

    const user = state.user || {};
    const nickname = user.nickname || "Guest";
    const email = user.email || "example@gmail.com";
    // email, который показываем пользователю
    const displayEmail = user.is_guest
        ? "Guest account (no email)"
        : email;

    const avatarSrc = user.avatar_url
        ? `../../../assets/icons/${user.avatar_url}`
        : "../../../assets/icons/default.png";

    // подписки на изменения языков и истории слов
    state.on("interface", () => renderProfile());

    screen.innerHTML = `

        <h3 class="ui-title">${t("profile", "profile_title")} =${nickname}=</h3>

        <div class="user-body ui-modal-body">
            <section class="profile-hero">
                <div class="profile-avatar-wrap">
                    <img class="profile-avatar" src="${avatarSrc}" alt="${nickname}">
                </div>

                <div class="profile-identity">
                    <h2 class="profile-name">${nickname}</h2>
                    <p class="profile-email">${displayEmail}</p>
                    <span class="profile-badge">${t("profile", "active_learner")}</span>
                </div>
            </section>

            <section class="profile-section">
                <div class="profile-section-head">
                    <h3 class="profile-section-title">${t("profile", "profile_section1")}</h3>
                </div>

                <div class="profile-grid">
                    <label class="profile-field">
                        <span class="ui-label">${t("profile", "nickname_label")}</span>
                        <input class="input-word" type="text" value="${nickname}" placeholder="Your nickname">
                    </label>

                    <label class="profile-field">
                        <span class="ui-label">Email</span>
                        <input class="input-word" type="email" value="${displayEmail}" placeholder="you@example.com">
                    </label>
                </div>
            </section>

            <section class="profile-section">
                <div class="profile-section-head">
                    <h3 class="profile-section-title">${t("profile", "profile_section2")}</h3>
                </div>

                <div class="profile-stats">
                    <div class="profile-stat">
                        <span class="profile-stat-value">0</span>
                        <span class="profile-stat-label">${t("profile", "words_learned")}</span>
                    </div>
                    <div class="profile-stat">
                        <span class="profile-stat-value">0</span>
                        <span class="profile-stat-label">${t("profile", "sets_completed")}</span>
                    </div>
                    <div class="profile-stat">
                        <span class="profile-stat-value">0</span>
                        <span class="profile-stat-label">${t("profile", "current_streak")}</span>
                    </div>
                </div>
            </section>

            <section class="profile-section">
                <div class="profile-section-head">
                    <h3 class="profile-section-title">Actions</h3>
                </div>

                <div class="profile-actions">
                    <div class="save-slot"></div>
                    <div class="sign-out-user-slot"></div>
                    <div class="delete-user-slot"></div>
                </div>
            </section>
        </div>
    `;


    const saveSlot = screen.querySelector(".save-slot");
    const signOutSlot = screen.querySelector(".sign-out-user-slot");
    const deleteSlot = screen.querySelector(".delete-user-slot");

    const quitBtn = new BaseButton({
        label: t("profile", "quit_btn"),
        type: "ui-user-btn",
        icon: "",
        action: "click",
        handler: () => {
            logInfo("Quit Profile button clicked");
            windowManager.back();
        }
    }).render();

    const signOutBtn = new BaseButton({
        label: t("profile", "sign_out_btn"),
        type: "ui-user-btn profile-secondary-btn",
        icon: "",
        action: "click",
        handler: () => {
            logInfo("Sign Out button clicked");
            console.log("Sign Out button click");
            windowManager.open("signOutModal");
            windowManager.back();
        }
    }).render();

    const deleteBtn = new BaseButton({
        label: t("profile", "delete_btn"),
        type: "ui-user-btn profile-danger-btn",
        icon: "",
        action: "click",
        handler: () => {
            logInfo("Login with Google button clicked");
            console.log("Delete button click");
            windowManager.open("deleteAccountModal");
            windowManager.back();
        }
    }).render();

    saveSlot.appendChild(quitBtn);
    signOutSlot.appendChild(signOutBtn);
    deleteSlot.appendChild(deleteBtn);

}
