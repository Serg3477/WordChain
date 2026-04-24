import { state } from "../../core/state.js";
import { windowManager } from "../core/windowManager.js";
import { makeDraggable } from "./utils/drag.js";
import { makeResizable } from "./utils/resize.js";
import { CloseButton } from "../ui/buttons/close/closeButton.js";



export function createRegistrationModal() {
    const root =document.createElement("div");
    root.className = "overall-modal ui-modal";

    root.innerHTML = `
        <div class="modal-header ui-modal-header">
            <span class="modal-title ui-modal-title">Register account</span>
            <div class="ui-modal-btn" data-role="close-btn"></div>
        </div>

        <div class = "modal-body ui-modal-body">
            <!-- EMAIL REGISTRATION FORM -->
            <form class="reg-form">

                <label class="ui-label">Email</label>
                <input type="email" class="ui-input" id="reg-email" placeholder="you@example.com">

                <label class="ui-label">Password</label>
                <input type="password" class="ui-input" id="reg-pass" placeholder="••••••••">

                <label class="ui-label">Confirm Password</label>
                <input type="password" class="ui-input" id="reg-pass2" placeholder="••••••••">

                <label class="ui-checkbox">
                    <input type="checkbox" id="reg-terms">
                    <span>I agree to the Terms of Service</span>
                </label>

                <button type="submit" class="ui-btn">
                    Create Account
                </button>
            </form>

            <!-- DIVIDER -->
            <div class="divider">
                <span>or</span>
            </div>

            <!-- GOOGLE OAUTH -->
            <button class="ui-btn oauth-btn" id="google-auth">
                <img src="../assets/icons/google.png" class="oauth-icon">
                Continue with Google
            </button>

        </div>
        <br>
        <div class="modal-footer ui-modal-footer">
            <span>Already have an account?</span>
            <a class="ui-link" data-action="open-login">Sign In</a>
        </div>
    `;


    // ---------------------------
    // УТИЛИТЫ
    // ---------------------------
    const header = root.querySelector(".modal-header");
    makeDraggable(root, header);
    makeResizable(root);

    return root;
}


