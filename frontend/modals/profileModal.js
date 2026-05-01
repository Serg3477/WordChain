import { state } from "../core/state.js";
import { windowManager } from "../core/windowManager.js";
import { makeDraggable } from "./utils/drag.js";
import { makeResizable } from "./utils/resize.js";
import { CloseButton } from "../ui/buttons/close/closeButton.js";



export function createProfileModal() {
    const root =document.createElement("div");
    root.className = "overall-modal profile-modal ui-modal";

    const user = state.user || {};
    const nickname = user.nickname || "Guest";
    const email = user.email || "example@gmail.com";
    const avatarSrc = user.avatar_url
        ? `/assets/icons/${user.avatar_url}`
        : "../assets/icons/default.png";

    root.innerHTML = `
        <div class="modal-header ui-modal-header">
            <span class="modal-title ui-modal-title">Profile</span>
            <div class="ui-modal-btn" data-role="close-btn"></div>
        </div>

        <div class="user-body ui-modal-body">
            <section class="profile-hero">
                <div class="profile-avatar-wrap">
                    <img class="profile-avatar" src="${avatarSrc}" alt="${nickname}">
                </div>

                <div class="profile-identity">
                    <h2 class="profile-name">${nickname}</h2>
                    <p class="profile-email">${email}</p>
                    <span class="profile-badge">Active learner</span>
                </div>
            </section>

            <section class="profile-section">
                <div class="profile-section-head">
                    <h3 class="profile-section-title">Account</h3>
                </div>

                <div class="profile-grid">
                    <label class="profile-field">
                        <span class="ui-label">Nickname</span>
                        <input class="input-word" type="text" value="${nickname}" placeholder="Your nickname">
                    </label>

                    <label class="profile-field">
                        <span class="ui-label">Email</span>
                        <input class="input-word" type="email" value="${email}" placeholder="you@example.com">
                    </label>
                </div>
            </section>

            <section class="profile-section">
                <div class="profile-section-head">
                    <h3 class="profile-section-title">Progress</h3>
                </div>

                <div class="profile-stats">
                    <div class="profile-stat">
                        <span class="profile-stat-value">0</span>
                        <span class="profile-stat-label">Words learned</span>
                    </div>
                    <div class="profile-stat">
                        <span class="profile-stat-value">0</span>
                        <span class="profile-stat-label">Sets completed</span>
                    </div>
                    <div class="profile-stat">
                        <span class="profile-stat-value">0</span>
                        <span class="profile-stat-label">Current streak</span>
                    </div>
                </div>
            </section>

            <section class="profile-section">
                <div class="profile-section-head">
                    <h3 class="profile-section-title">Actions</h3>
                </div>

                <div class="profile-actions">
                    <button type="button" class="ui-user-btn">Save Changes</button>
                    <button type="button" class="ui-user-btn profile-secondary-btn" data-action="sign-out">Sign Out</button>
                    <button type="button" class="ui-user-btn profile-danger-btn" data-action="delete-account">Delete Account</button>
                </div>
            </section>
        </div>
    `;

    const closeBtnContainer = root.querySelector('[data-role="close-btn"]');
    const signOutBtn = root.querySelector('[data-action="sign-out"]');
    const deleteAccountBtn = root.querySelector('[data-action="delete-account"]');

    const closeBtn = new CloseButton({
        action: "click",
        handler: closeWithScale
    }).render();

    function closeWithScale() {
        root.classList.add("modal-scale-out");
        setTimeout(() => {
            windowManager.close("profileModal");
        }, 350);
    }

    closeBtnContainer.appendChild(closeBtn);

    if (signOutBtn) {
        signOutBtn.addEventListener("click", () => {
            windowManager.open("signOutModal");
        });
    }

    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener("click", () => {
            windowManager.open("deleteAccountModal");
        });
    }

    const header = root.querySelector(".modal-header");
    makeDraggable(root, header);
    makeResizable(root);

    return root;
}
