import { state } from "../../core/state.js";
import { windowManager } from "../core/windowManager.js";
import { makeDraggable } from "./utils/drag.js";
import { makeResizable } from "./utils/resize.js";
import { CloseButton } from "../ui/buttons/close/closeButton.js";
import { registerUser } from "../features/user/register.js";



export function createRegistrationModal() {
    const root =document.createElement("div");
    root.className = "overall-modal reg-login-modal ui-modal";
    

    root.innerHTML = `
        <div class="modal-header ui-modal-header">
            <span class="modal-title ui-modal-title">Register account</span>
            <div class="ui-modal-btn" data-role="close-btn"></div>
        </div>

        <div class = "user-body ui-modal-body">
            <!-- EMAIL REGISTRATION FORM -->
            <form class="user-form" name="registration" action="/register">

                <label class="ui-label">Your name</label>
                <input class="input-word" type="text" name="name" required placeholder="or nickname">

                <label class="ui-label">Email</label>
                <input class="input-word" type="email" name="email" required autocomplete="email" placeholder="you@example.com">

                <label class="ui-label">Password</label>
                <input class="input-word" type="password" name="password" required minlength="8" autocomplete="new-password" placeholder="••••••••">

                <label class="ui-label">Confirm Password</label>
                <input class="input-word" type="password" name="passwordConfirmation" required minlength="8" autocomplete="new-password" placeholder="••••••••"><br>

                <label class="ui-checkbox">
                    <input type="checkbox" name="reg-terms" required>
                    <span>I agree to the Terms of Service</span>
                </label><br>

                <button type="submit" class="ui-user-btn">
                    Create Account
                </button>
            </form>

            <!-- DIVIDER -->
            <div class="divider">
                <span>or</span>
            </div>

            <!-- GOOGLE OAUTH -->
            <button class="ui-user-btn oauth-btn" id="google-auth">
                <img src="../assets/icons/google.png" class="oauth-icon">
                Continue with Google
            </button>

        </div>
        <br>
        <div class="modal-footer">
            <span>Already have an account?</span>
            <a class="ui-user-link" data-action="open-login">Sign In</a>
        </div>
    `;

    const formReg = root.querySelector('form[name="registration"]');
    formReg.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (formReg.password.value != formReg.passwordConfirmation.value) {
            throw new Error ('Mismatch Password vc Confirm Password');
            return
        }
        if (!formReg.reportValidity()) {
            throw new Error ('Lost reportValidity');
            return
        }
        const data = { name: formReg.name.value, email: formReg.email.value, password: formReg.password.value };
        const res = await registerUser(data);
        localStorage.setItem("token", res.token);
        state.setUser({
            nickname: res.nickname,
            avatar_url: res.avatar_url,
            email: res.email,
            token: res.token,
            is_guest: res.is_guest,
            is_premium: res.is_premium
        });

    });
    


    const closeBtnContainer = root.querySelector('[data-role="close-btn"]');
    const openLoginLink = root.querySelector('[data-action="open-login"]');

    // ---------------------------
    // КНОПКА ЗАКРЫТИЯ
    // ---------------------------
    const closeBtn = new CloseButton({
        action: "click",
        handler: closeWithScale
    }).render();

    function closeWithScale() {
        root.classList.add("modal-scale-out");
        setTimeout(() => {
        windowManager.close("registrationModal");
        }, 350);
    }

    closeBtnContainer.appendChild(closeBtn);

    if (openLoginLink) {
        openLoginLink.addEventListener("click", (event) => {
            event.preventDefault();
            windowManager.open("loginModal");
        });
    }

    // ---------------------------
    // УТИЛИТЫ
    // ---------------------------
    const header = root.querySelector(".modal-header");
    makeDraggable(root, header);
    makeResizable(root);

    return root;
}

