import { windowManager } from "../core/windowManager.js";
import { state } from "../core/state.js";
import { ensureGuestSession } from "../features/user/guest.js";
import { makeDraggable } from "./utils/drag.js";
import { makeResizable } from "./utils/resize.js";

function createAccountActionModal({ modalName, title, question, yesLabel = "Yes", noLabel = "No" }) {
    const root = document.createElement("div");
    root.className = "overall-modal ui-modal confirm-modal";

    root.innerHTML = `
        <div class="modal-header ui-modal-header">
            <span class="modal-title ui-modal-title">${title}</span>
        </div>

        <div class="confirm-body ui-modal-body">
            <p class="confirm-question">${question}</p>

            <div class="confirm-actions">
                <button type="button" class="ui-user-btn" data-action="confirm-yes">${yesLabel}</button>
                <button type="button" class="ui-user-btn confirm-no-btn" data-action="confirm-no">${noLabel}</button>
            </div>
        </div>
    `;

    const yesBtn = root.querySelector('[data-action="confirm-yes"]');
    const noBtn = root.querySelector('[data-action="confirm-no"]');

    function closeModal() {
        root.classList.add("modal-scale-out");
        setTimeout(() => {
            windowManager.close(modalName);
        }, 350);
    }

    yesBtn.addEventListener("click", async () => {await signOutOrDeleteAccount(modalName), closeModal()});
    noBtn.addEventListener("click", closeModal);

    const header = root.querySelector(".modal-header");
    makeDraggable(root, header);
    makeResizable(root);

    return root;
}

export function createSignOutModal() {
    return createAccountActionModal({
        modalName: "signOutModal",
        title: "Sign Out",
        question: "Are you sure you want to sign out?"
    });
}

export function createDeleteAccountModal() {
    return createAccountActionModal({
        modalName: "deleteAccountModal",
        title: "Delete Account",
        question: "Are you sure you want to delete your account?"
    });
}

async function signOutOrDeleteAccount(modalName) {
    if (modalName == "signOutModal") {
        await ensureGuestSession();
        state.setUser({token: localStorage.getItem("guest_token")});

    }
}


