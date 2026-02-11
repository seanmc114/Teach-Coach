// ==============================
// TURBO COACH — STABLE GAME VERSION
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
let currentPrompt = "";
let startTime = null;

// ---------------- PROMPTS ----------------

function getRandomPrompt() {
  return PROMPT_BANK[Math.floor(Math.random() * PROMPT_BANK.length)];
}

// ---------------- TIMER ----------------

function getElapsedTime() {
  if (!startTime) return 0;
  return Math.floor((Date.now() - startTime) / 1000);
}

// ---------------- VERB DETECTION (MULTI-TENSE SAFE) ----------------

function hasVerb(answer, lang) {

  const a = answer.toLowerCase();

  if (lang === "es")
    return /\b(fui|fue|era|eran|estaba|estaban|soy|eres|es|somos|está|estoy|tengo|tiene|tenemos|hay|voy|vas|van|iré|podré|podría|[a-záéíóúñ]+(o|as|a|amos|an|é|ó|aba|ía))\b/.test(a);

  if (lang === "fr")
    return /\b(suis|es|est|sommes|ai|as|a|étais|allé|vais|irai|[a-zéèê]+(e|es|ent|ons|é|ait))\b/.test(a);

  if (lang === "de")
    return /\b(bin|bist|ist|sind|war|habe|hat|ging|werde|[a-zäöüß]+(e|st|t|en))\b/.test(a);

  if (lang === "ga")
    return /\b(tá|bhí|is|bíonn|chuaigh|rachaidh|[a-záéíóú]+(ann|aim|amar|fidh))\b/.test(a);

  return false;
}

// ---------------- RULE LAYER ----------------

function ruleCheck(answer, lang) {

  const wc = answer.trim().split(/\s+/).length;

  if (wc < 2) {
    return { score: 2, focus: "Fragment", feedback: "Write a full sentence." };
  }

  if (!hasVerb(answer, lang)) {
    return { score: 3, focus: "Missing verb", feedback: "Add a verb to make it a real sentence." };
  }

  if (wc <= 4) {
    return { score: 5, focus: "Development", feedback: "Good start. Add one more clear detail." };
  }

  return null;
}

// ---------------- AI LAYER ----------------

async function aiRefine(task, answer, lang) {

  if (!window.classifyAnswer) return null;

  try {
    return await window.classifyAnswer({ task, answer, lang });
  } catch {
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

  // SET INITIAL PROMPT
  currentPrompt = getRandomPrompt();
  taskBox.innerText = "Task: " + currentPrompt;

  runBtn.onclick = async () => {

    if (!startTime) startTime = Date.now();

    const answer = ans.value.trim();
    const lang = langSelect.value;

    if (!answer) return;

    out.classList.remove("hidden");
    out.innerHTML = "Thinking…";

    let result = ruleCheck(answer, lang);

    if (!result) {
      result = await aiRefine(currentPrompt, answer, lang);
    }

    if (!result) {
      result = { score: 6, focus: "Development", feedback: "Add one more specific detail." };
    }

    scores.push(result.score);
    round++;

    renderRound(result);

    ans.value = "";
    ans.focus();

    if (round === CONFIG.ROUNDS) {
      renderSummary();
    }
  };

  function renderRound(result) {

    const progress = Math.round((round / CONFIG.ROUNDS) * 100);

    out.innerHTML = `
      <div><strong>Round ${round}/${CONFIG.ROUNDS}</strong></div>

      <div style="height:8px;background:#ddd;border-radius:8px;margin:8px 0;overflow:hidden;">
        <div style="height:8px;background:#003366;width:${progress}%;"></div>
      </div>

      <div><strong>Score:</strong> ${result.score}/10</div>
      <div><strong>Focus:</strong> ${result.focus}</div>
      <div><strong>Do this:</strong> ${result.feedback}</div>
    `;
  }

  function renderSummary() {

    const avg = Math.round(scores.reduce((a,b)=>a+b,0)/scores.length);
    const time = getElapsedTime();

    out.innerHTML = `
      <hr>
      <h3>Game Complete</h3>
      <div><strong>Average Score:</strong> ${avg}/10</div>
      <div><strong>Time:</strong> ${time}s</div>
      <div>Round scores: ${scores.join(" → ")}</div>
      <button id="newGame">Play again</button>
    `;

    document.getElementById("newGame").onclick = () => {
      round = 0;
      scores = [];
      startTime = null;
      currentPrompt = getRandomPrompt();
      taskBox.innerText = "Task: " + currentPrompt;
      out.classList.add("hidden");
      ans.value = "";
      ans.focus();
    };
  }

});
