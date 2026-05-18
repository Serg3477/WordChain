import { windowManager } from "../../../core/windowManager.js";
import { state } from "../../../core/state.js";
import { ensureGuestSession } from "../../../api/guest.js";
import { deleteUser } from "../../../api/user.js";
import { apiRequest } from "../../../core/api.js";

function createAccountActionModal({ modalName, title, question, yesLabel = "Yes", noLabel = "No" }) {
    const root = document.createElement("div");
    root.className = "overall-modal";
    

    root.innerHTML = `
        <div class="ui-modal confirm-modal">
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

    yesBtn.addEventListener("click", async () => {
        await signOutOrDeleteAccount(modalName);
        closeModal()
    });
    noBtn.addEventListener("click", closeModal);

    const header = root.querySelector(".modal-header");

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
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
        state.setUser({token: localStorage.getItem("guest_token")});
    }
    if (modalName == "deleteAccountModal") {
        const delUser = state.user.nickname;

        const res = await deleteUser({email: state.user.email});
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
        await ensureGuestSession();
        state.setUser({token: localStorage.getItem("guest_token")});
        console.log(`User ${delUser} ${res.message} `);
    }
}


