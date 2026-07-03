import { state } from "../../../core/state.js";
import { BaseButton } from "../../../ui/baseButton/baseButton.js";
import { updateSettings } from "../../../api/settings.js"
import { logInfo, logError } from "../../../utils/logger/logger.js";
import { Notification } from "../../../ui/notificationModal/notificationModal.js";
import { t } from "../../../shared/i18n/index.js"


// Изменение согласно подписке
state.on("user", () => renderSettings());
state.on("languages", () => renderSettings());
state.on("interface", () => renderSettings());
state.on("skills", () => renderSettings());


let isRenderingSettings = false;

export function renderSettings() {
  logInfo("Settings screen render start");
  if (isRenderingSettings) return;
  isRenderingSettings = true;

  try {
    const screen = document.querySelector('[data-screen="settings"]');
    logInfo("Settings screen node", { found: !!screen });

      if (!screen) {
          logError("Settings screen not found");
          return;
      }

    screen.innerHTML = `
      <div class="settings-screen">

      <!-- LANGUAGE SETTINGS -->
      <section class="settings-group">
          <h3 class="settings-title">${t("settings", "settings_title")} =${ state.user.nickname}=</h3>
          <h4 class="settings-email-title">Email: ${ state.user.email}</h4><br>
          <h3 class="settings-section-title">${t("settings", "settings_section1")}</h3>


          <div class="settings-item">
          <label>${t("settings", "input_language")}</label>
          <select id="input-lang" class="settings-select">
              <option value="en">${t("settings", "input_english")}</option>
              <option value="ua">${t("settings", "input_ukrainian")}</option>
              <option value="ru">${t("settings", "input_russian")}</option>
              <option value="de">${t("settings", "input_german")}</option>
              <option value="fr">${t("settings", "input_french")}</option>
              <option value="es">${t("settings", "input_spanish")}</option>
              <option value="it">${t("settings", "input_italian")}</option>
              <option value="pl">${t("settings", "input_polish")}</option>
          </select>
          </div>

          <div class="settings-item">
          <label>${t("settings", "output_language")}</label>
          <select id="output-lang" class="settings-select">
              <option value="en">${t("settings", "output_english")}</option>
              <option value="ua">${t("settings", "output_ukrainian")}</option>
              <option value="ru">${t("settings", "output_russian")}</option>
              <option value="de">${t("settings", "output_german")}</option>
              <option value="fr">${t("settings", "output_french")}</option>
              <option value="es">${t("settings", "output_spanish")}</option>
              <option value="it">${t("settings", "output_italian")}</option>
              <option value="pl">${t("settings", "output_polish")}</option>
          </select>
          </div>

          <div class="settings-item">
          <label>${t("settings", "user_level")}</label>
          <select id="user-level" class="settings-select" >
              <option value="A1">A1</option>
              <option value="A2">A2</option>
              <option value="B1">B1</option>
              <option value="B2">B2</option>
              <option value="C1">C1</option>
              <option value="C2">C2</option>
          </select>
          </div>

          <div class="settings-item">
          <label>${t("settings", "text_size")}</label>
          <input id="text-size" type="number" min="1" max="10" class="settings-input">
          </div>

          <div class="settings-item">
          <label>${t("settings", "examples_count")}</label>
          <input id="examples-count" type="number" min="1" max="10" class="settings-input">
          </div>
      </section>

      <!-- INTERFACE SETTINGS -->
      <section class="settings-group">
          <h3 class="settings-section-title">${t("settings", "settings_section2")}</h3>

          <div class="settings-item">
          <label>${t("settings", "set_theme")}</label>
          <select id="theme" class="settings-select">
              <option value="light">${t("settings", "theme_light")}</option>
              <option value="dark">${t("settings", "theme_dark")}</option>
          </select>
          </div>

          <div class="settings-item">
          <label>${t("settings", "interface_language")}</label>
          <select id="ui-lang" class="settings-select">
              <option value="en">${t("settings", "lang_english")}</option>
              <option value="ua">${t("settings", "lang_ukrainian")}</option>
              <option value="ru">${t("settings", "lang_russian")}</option>
              <option value="de">${t("settings", "lang_german")}</option>
              <option value="fr">${t("settings", "lang_french")}</option>
              <option value="es">${t("settings", "lang_spanish")}</option>
              <option value="it">${t("settings", "lang_italian")}</option>
              <option value="pl">${t("settings", "lang_polish")}</option>
          </select>
          </div>

          <div class="settings-item">
          <label>${t("settings", "ai_voice")}</label>
          <select id="voice-type" class="settings-select">
              <option value="alloy">Alloy</option>
              <option value="echo">Echo</option>
              <option value="fable">Fable</option>
              <option value="onyx">Onyx</option>
              <option value="nova">Nova</option>
              <option value="shimmer">Shimmer</option>
          </select>
          </div>

      </section>

      <!-- BUTTONS ROW -->
        <div class="buttons-row"></div>

      </div>
    `;

      const buttonsRow = screen.querySelector(".buttons-row");
      const inputLang = screen.querySelector("#input-lang");
      const outputLang = screen.querySelector("#output-lang");
      const userLevel = screen.querySelector("#user-level");
      const textSize = screen.querySelector("#text-size");
      const examplesCount = screen.querySelector("#examples-count");
      const theme = screen.querySelector("#theme");
      const uiLanguage = screen.querySelector("#ui-lang");
      const voiceType = screen.querySelector("#voice-type");

      // Устанавливаем значения
      inputLang.value = state.sourceLang;
      outputLang.value = state.targetLang;
      userLevel.value = state.userSkill.level;
      textSize.value = state.userSkill.text_size;
      examplesCount.value = state.userSkill.examples_count;
      theme.value = state.userInterface.theme;
      uiLanguage.value = state.userInterface.ui_language;
      voiceType.value = state.userInterface.ai_voice;


      // ---------------------------
      // КНОПКА SAVE
      // ---------------------------
      const saveBtn = new BaseButton({
        label: t("settings", "save_btn"),
        type: "ui-btn",
        icon:  `<img src="/assets/icons/Check.png" alt="💾">`,
        action: "click",
        handler: doSaveSettings
      }).render();
    
      async function doSaveSettings() {
        logInfo("Save Settings button clicked");

        const currentSettings = {
          user_id: state.user.id,
          input_lang: inputLang.value,
          output_lang: outputLang.value,
          user_level: userLevel.value,
          text_size: Number(textSize.value),
          examples_count: Number(examplesCount.value),
          ui_theme: theme.value,
          ui_lang: uiLanguage.value,
          voice_type: voiceType.value
        };

        if (!currentSettings.user_id) return;
        try {
          const settings = await updateSettings({
            endpoint: "/update_settings",
            method: "PUT",
            currentSettings: currentSettings
          });
          logInfo("Save settings request success - components/settings.js /update_settings");

          // Сохраняем в state
          if (settings) {
            logInfo("Settings loaded and set into state - components/settings.js setLanguages");
            state.setLanguages(settings.input_lang, settings.output_lang);
            state.setUserSkill( settings.user_level, settings.text_size, settings.examples_count );
            state.setUserInterface( settings.ui_lang, settings.ui_theme, settings.voice_type ); 
          }  
          Notification.show({ type: "success", message: t("settings", "notification_save")});
        } catch (e) {
          logError("Save settings request failed in UI  - components/settings.js /update_settings", { error: e.message });
          return;
        }
      }

      buttonsRow.appendChild(saveBtn);
  } finally {
      isRenderingSettings = false;
  }
};

