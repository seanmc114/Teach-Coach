// ==============================
// TURBO COACH — HYBRID AUTHORITY ENGINE
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

// ---------------- PROMPT ----------------

function getRandomPrompt() {
  return PROMPT_BANK[Math.floor(Math.random() * PROMPT_BANK.length)];
}

// ---------------- VERB DETECTION ----------------

function hasVerb(answer, lang) {
  const a = answer.toLowerCase();

  if (lang === "es")
    return /\b(es|soy|eres|somos|está|estoy|estamos|tiene|tengo|tienes|vive|vivo|vives|hay|gustan?|puedo|podría|podre|podré)\b/.test(a);

  if (lang === "fr")
    return /\b(est|suis|es|sommes|avez|a|ont|ai|aime|habite|vais|va)\b/.test(a);

  if (lang === "ga")
    return /\b(tá|is|bhfuil|bíonn|bhí)\b/.test(a);

  if (lang === "de")
    return /\b(ist|bin|bist|hat|habe|hast|sind|mag|wohne)\b/.test(a);

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
    if (lang === "es")
      return { score: 3, focus: "Missing verb", feedback: "Add a verb. Try: **es**, **tiene**, **vive**." };

    if (lang === "fr")
      return { score: 3, focus: "Missing verb", feedback: "Add a verb. Try: **est**, **a**, **habite**." };

    if (lang === "ga")
      return { score: 3, focus: "Missing verb", feedback: "Add a verb. Try: **tá sé…** or **is…**." };

    if (lang === "de")
      return { score: 3, focus: "Missing verb", feedback: "Add a verb. Try: **ist**, **hat**, **wohnt**." };
  }

  if (wc <= 4) {
    return {
      score: 5,
      focus: "Development",
      feedback: "Good start. Add ONE more detail about appearance, personality or reason."
    };
  }

  return null; // No rule block — allow AI refinement
}

// ---------------- AI LAYER ----------------

async function aiRefine(task, answer, lang) {

  if (!window.classifyAnswer) return null;

  try {
    const res = await window.classifyAnswer({
      task,
      answer,
      lang
    });

    return res;
  } catch (e) {
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

    // ---------------- RULE CHECK FIRST ----------------

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
