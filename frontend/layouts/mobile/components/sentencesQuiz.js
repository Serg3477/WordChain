import { sentenceQuizRequest } from "../../../api/quizes.js"

import {logError, logInfo} from "../../../utils/logger/logger.js";
import {BaseButton} from "../../../ui/baseButton/baseButton.js";


export function renderSentencesQuiz() {
    logInfo("Sentences Quiz screen render start");

    const screen = document.querySelector('[data-screen="sentencesQuiz"]');
    if (!screen) {
        logError("Sentences Quiz screen not found");
        return;
    }

    screen.innerHTML = `
        <div class="sq-screen">
            <div class="sq-sentence-container">
                <h3 class="sq-sentence-title">Choose right answer</h3>
                <div class="sq-sentence-output"></div>
            </div>
            
            <button class="sq-button"></button>
            
            <div class="sq-answers-container">
                <div class="sq-auxiliary-container">
                    <ul class="sq-sentence-answer-auxiliary"></ul>
                </div>
    
                <div class="sq-verb-container">
                    <ul class="sq-sentence-answer-verb"></ul>
                </div>
            </div>

        </div>
    `;

    const sentenceOutput = screen.querySelector(".sq-sentence-output");
    const answerAux = screen.querySelector(".sq-sentence-answer-auxiliary");
    const answerVerb = screen.querySelector(".sq-sentence-answer-verb");

    let result = null;

    const requestBtn = new BaseButton({
        label: "Get",
        type: "ui-btn",
        icon: `<img src="/assets/icons/Check.png" alt="💾">`,
        action: "click",
        handler: doRequestSentence
    }).render();
    screen.querySelector(".sq-button").replaceWith(requestBtn);

    async function doRequestSentence() {
        logInfo("Request Sentence button clicked");
        try {
            result = await sentenceQuizRequest();

            console.log(result.sentence);
            console.log(result.answers_auxiliary);
            console.log(result.answers_verb);
            console.log(result.right_answer_auxiliary);
            console.log(result.right_answer_verb);

            displaySentence(result);
            logInfo("Get quiz sentence success");

        } catch (e) {
            logError("Quiz Sentence request failed in UI", {error: e.message});
            return;
        }
    }

    function displaySentence(result) {
        sentenceOutput.textContent = result.sentence;

        answerAux.innerHTML = "";
        answerVerb.innerHTML = "";

        for (const answer of result.answers_auxiliary) {
            const item = document.createElement("li");
            item.textContent = answer === "NONE" ? "—" : answer;
            item.dataset.answer = answer;
            answerAux.append(item);
        }

        for (const answer of result.answers_verb) {
            const item = document.createElement("li");
            item.textContent = answer;
            item.dataset.answer = answer;
            answerVerb.append(item);
        }
    }

    answerAux.addEventListener("click", function(e) {
        const item = e.target.closest("li");
        if (!item || !answerAux.contains(item)) return;
        if (!result) return;
        const selectedAnswer = item.dataset.answer;
        answerAux.querySelectorAll("li").forEach(li => {
            li.classList.remove("selected");
        });
        item.classList.add("selected");
        logInfo(`Selected auxiliary: ${selectedAnswer}`);
        logInfo(`Right auxiliary: ${result.right_answer_auxiliary}`);
    });
    answerVerb.addEventListener("click", function(e) {
        const item = e.target.closest("li");
        if (!item || !answerVerb.contains(item)) return;
        if (!result) {
            logInfo("No result");
            return;
        }
        const selectedAnswer = item.dataset.answer;
        answerVerb.querySelectorAll("li").forEach(li => {
            li.classList.remove("selected");
        });
        item.classList.add("selected");
        logInfo(`Selected verb:  ${selectedAnswer}`);
        logInfo(`Right verb:  ${result.right_answer_verb}`);
    });
}



