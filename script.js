
// ==============================
// TURBO COACH — HYBRID AUTHORITY ENGINE (ALL TENSES)
// ==============================

const CONFIG = { ROUNDS: 3 };

const PROMPT_BANK = [
  "Describe your best friend",
  "Describe someone in your family",
  "Describe your school",
  "Describe your house",
  "Describe your favourite subject",
  "Describe your weekend"
];

let round = 0;
let scores = [];
let focusLog = [];
let currentPrompt = "";

// ---------------- PROMPTS ----------------

function getRandomPrompt() {
  return PROMPT_BANK[Math.floor(Math.random() * PROMPT_BANK.length)];
}

// ---------------- VERB DETECTION (MULTI-TENSE) ----------------

function hasVerb(answer, lang) {

  const a = answer.toLowerCase();

  // -------- SPANISH --------
  if (lang === "es") {
    return /\b(
      fui|fue|fuimos|eran?|era|estaba|estaban|estuve|estuvo|
      es|soy|eres|somos|está|estoy|estamos|
      hay|hubo|había|habia|
      iré|ire|irá|ira|vamos|voy|vas|van|
      [a-záéíóúñ]+(o|as|a|amos|an|é|aste|ó|aron|aba|abas|aban|ía|ías|ieron|í)
    )\b/i.test(a);
  }

  // -------- FRENCH --------
  if (lang === "fr") {
    return /\b(
      suis|es|est|sommes|êtes|sont|
      ai|as|a|avons|avez|ont|
      étais|était|étaient|
      allé|allée|allés|allées|
      vais|va|allons|irez|irai|
      [a-zéèê]+(e|es|ent|ons|ai|ais|ait|aient|é|ée|ées|és)
    )\b/i.test(a);
  }

  // -------- GERMAN --------
  if (lang === "de") {
    return /\b(
      bin|bist|ist|sind|seid|
      habe|hast|hat|haben|hattet|
      war|waren|warst|
      ging|gingen|gingst|
      werde|wirst|wird|werden|
      [a-zäöüß]+(e|st|t|en)
    )\b/i.test(a);
  }

  // -------- IRISH --------
  if (lang === "ga") {
    return /\b(
      tá|táim|táimid|bhí|bhíomar|bhfuil|
      is|ba|bíonn|
      chuaigh|rachaidh|rachaimid|
      rinne|rinneamar|
      [a-záéíóú]+(ann|aim|amar|fidh|faidh|íonn)
    )\b/i.test(a);
  }

  return false;
}

// ---------------- RULE LAYER ----------------

function ruleCheck(answer, lang) {

  const wc = answer.trim().split(/\s+/).length;

  if (wc < 2) {
    return {
      score: 2,
      focus: "Fragment",
      feedback: "That’s not a full sentence yet. Add a subject and a verb."
    };
  }

  if (!hasVerb(answer, lang)) {

    const examples = {
      es: "Try: es / fui / voy / iré",
      fr: "Try: est / suis allé / vais / serai",
      de: "Try: ist / war / gehe / werde",
      ga: "Try: tá / bhí / chuaigh / beidh"
    };

    return {
      score: 3,
      focus: "Missing verb",
      feedback: "Add a verb. " + examples[lang]
    };
  }

  if (wc <= 4) {
    return {
      score: 5,
      focus: "Development",
      feedback: "Good start. Add ONE more detail about appearance, personality, or reason."
    };
  }

  return null;
}

// ---------------- AI LAYER ----------------

async function aiRefine(task, answer, lang) {

  if (!window.classifyAnswer) return null;

  try {
    return await window.classifyAnswer({ task, answer, lang });
  } catch {
    console.warn("AI failed");
    return null;
  }
}

// ---------------- GAME LOGIC ----------------

document.addEventListener("DOMContentLoaded", () => {

  const runBtn = document.getElementById("runBtn");
  const ans = document.getElementById("answer");
  const out = document.getElementById("out");
  const langSelect = document.getElementById("lang");
  const taskBox = document.getElementById("taskBox");

  currentPrompt = getRandomPrompt();
  taskBox.innerText = "Task: " + currentPrompt;

  runBtn.onclick = async () => {

    const answer = ans.value.trim();
    const lang = langSelect.value;

    if (!answer) return;

    ans.disabled = true;
    runBtn.disabled = true;

    out.classList.remove("hidden");
    out.innerHTML = "Thinking…";

    let result = ruleCheck(answer, lang);

    if (!result) {
      result = await aiRefine(currentPrompt, answer, lang);
    }

    if (!result) {
      result = {
        score: 6,
        focus: "Development",
        feedback: "Good structure. Add one more specific detail."
      };
    }

    scores.push(result.score);
    focusLog.push(result.focus);
    round++;

    renderResult(result);

    if (round === CONFIG.ROUNDS) {
      renderSummary();
    }

    ans.disabled = false;
    runBtn.disabled = false;
  };

  function renderResult(result) {

    out.innerHTML = `
      <div><strong>Score:</strong> ${result.score}/10</div>
      <div><strong>Focus:</strong> ${result.focus}</div>
      <div><strong>Do this:</strong> ${result.feedback}</div>

      <div class="teacherBar">
        <button data-v="clear">👍 Clear</button>
        <button data-v="unclear">🔁 Could be clearer</button>
        <button data-v="bad">❌ Not helpful</button>
      </div>
    `;

    out.querySelectorAll(".teacherBar button").forEach(btn => {
      btn.onclick = () => {
        console.log("Teacher feedback:", btn.dataset.v);
        btn.disabled = true;
      };
    });
  }

  function renderSummary() {

    const avg = Math.round(scores.reduce((a,b)=>a+b,0)/scores.length);

    out.innerHTML += `
      <hr>
      <h3>End of Round</h3>
      <div>Average score: ${avg}/10</div>
      <div>Main focus areas: ${[...new Set(focusLog)].join(", ")}</div>
      <button id="newGame">Play again</button>
    `;

    document.getElementById("newGame").onclick = () => {
      round = 0;
      scores = [];
      focusLog = [];
      currentPrompt = getRandomPrompt();
      taskBox.innerText = "Task: " + currentPrompt;
      out.classList.add("hidden");
      ans.value = "";
      ans.focus();
    };
  }

});
