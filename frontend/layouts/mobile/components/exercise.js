import { state } from "../../../core/state.js";
import { windowManager } from "../../../core/windowManager.js";
import { BaseButton } from "../../../ui/baseButton/baseButton.js";
import { engineRequest } from "../../../api/engine.js";
import { Notification } from "../../../ui/notificationModal/notificationModal.js";
import { t } from "../../../shared/i18n/index.js";
import { logInfo, logError } from "../../../utils/logger/logger.js";
import { escapeHtml } from "../../../shared/wordHelpers.js";

export async function renderExercise() {
  logInfo("Exercise screen render start");

  const screen = document.querySelector('[data-screen="exercise"]');
  if (!screen) {
    logError("Exercise screen not found");
    return;
  }

  screen.innerHTML = `
    <div class="exercise-screen">

      <div class="word-back">
        <button class="word-back-btn" data-action="back">
          <img src="/assets/icons/Arrows.png" class="word-back-icon" alt="←">
          <span>Back</span>
        </button>
      </div>

      <h3 class="exercise-title">${t("appMenu", "exercise_label")}</h3>

      <div class="exercise-item">
        <label class="exercise-label">Intent</label>
        <select id="intent" class="exercise-select">
          <option value="STATE_FACT">State a fact</option>
          <option value="DESCRIBE_ACTION">Describe an action</option>
          <option value="DESCRIBE_EVENT">Describe an event</option>
          <option value="DESCRIBE_DURATION">Describe duration</option>
          <option value="DESCRIBE_PLAN">Describe a plan</option>
          <option value="MAKE_PREDICTION">Make a prediction</option>
          <option value="REQUEST_INFORMATION">Request information</option>
          <option value="REQUEST_ACTION">Request an action</option>
          <option value="OFFER_HELP">Offer help</option>
          <option value="ASK_PERMISSION">Ask or give permission</option>
          <option value="EXPRESS_NEGATION">Express negation</option>
          <option value="MAKE_COMPARISON">Make a comparison</option>
          <option value="EXPLAIN_CAUSE">Explain cause and effect</option>
          <option value="EXPRESS_CONDITION">Express a condition</option>
          <option value="EXPRESS_OPINION">Express an opinion</option>
        </select>
      </div>

      <div class="exercise-item">
        <label class="exercise-label">Tense</label>
        <select id="tense" class="exercise-select">
          <option value="ANY">Any tense</option>
          <option value="PRESENT_SIMPLE">Present Simple</option>
          <option value="PRESENT_CONTINUOUS">Present Continuous</option>
          <option value="PRESENT_PERFECT">Present Perfect</option>
          <option value="PAST_SIMPLE">Past Simple</option>
          <option value="PAST_CONTINUOUS">Past Continuous</option>
          <option value="PAST_PERFECT">Past Perfect</option>
          <option value="PAST_PERFECT_CONTINUOUS">Past Perfect Continuous</option>
          <option value="FUTURE_SIMPLE">Future Simple</option>
          <option value="FUTURE_CONTINUOUS">Future Continuous</option>
          <option value="FUTURE_PERFECT">Future Perfect</option>
          <option value="FUTURE_PERFECT_CONTINUOUS">Future Perfect Continuous</option>
        </select>
      </div>

      <div class="exercise-level">
        Level: ${escapeHtml(state.userSkill.level)}
      </div>

      <div class="exercise-btn" id="exercise-btn"></div>


      <div class="exercise-result-box">
        <div class="exercise-result-title">Result</div>
        <div class="exercise-result-text" id="exercise-result"></div>
      </div>
    </div>
  `;

  // Elements
  const intent = screen.querySelector("#intent");
  const tense = screen.querySelector("#tense");
  const result = screen.querySelector("#exercise-result");
  const btnContainer = screen.querySelector("#exercise-btn");

  // Back button
  const backBtn = screen.querySelector('[data-action="back"]');
  backBtn.addEventListener("click", () => windowManager.open("menu"));

  // Main button
  const resBtn = new BaseButton({
    label: "= Test =",
    type: "ui-btn",
    icon: `<img src="/assets/icons/Fire.png" alt="🔥">`,
    action: "click",
    handler: doExercise
  }).render();

  btnContainer.appendChild(resBtn);

  async function doExercise() {
    try {
      const res = await engineRequest({
        endpoint: "/engine",
        method: "POST",
        level: state.userSkill.level,
        intent: intent.value,
        tense: tense.value,
        language: state.sourceLang
      });

      logInfo("Engine request success");

      Notification.show({
        type: "success",
        message: "Engine response received"
      });

      result.textContent = escapeHtml(res.result);

    } catch (e) {
      logError("Engine request failed", { error: e.message });
      Notification.show({
        type: "error",
        message: "Engine request failed"
      });
    }
  }
}
