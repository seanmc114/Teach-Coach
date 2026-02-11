// ==============================
// TURBO COACH — 3 ROUND ENGINE
// ==============================

const CONFIG = {
  ROUNDS: 3   // Change to 5, 10 etc later for big game mode
};

const PROMPT_BANK = [
  "Describe your best friend",
  "Describe someone in your family",
  "Describe yourself",
  "Describe your school",
  "Describe your house or flat",
  "Describe your town or area",
  "Describe your hobbies",
  "Describe a typical weekend",
  "Describe your favourite subject",
  "Describe a person you admire"
];

let round = 0;
let roundScores = [];
let roundFocus = [];
let currentPrompt = "";

function getRandomPrompt() {
  return PROMPT_BANK[Math.floor(Math.random() * PROMPT_BANK.length)];
}

// ---------------- RULE ENGINE ----------------

function ruleCheck(answer, lang) {
  const a = answer.toLowerCase();

  if (lang === "es") {
    if (/\bmi amigo\b/.test(a) && /\beres\b/.test(a)) {
      return { score: 3, focus: "Verb agreement", feedback: "“Eres” is for 'you'. Use “es” for 'he'." };
    }
  }

  if (lang === "fr") {
    if (/\bcest\b/.test(a)) {
      return { score: 4, focus: "Apostrophe", feedback: "Use “c’est” with an apostrophe." };
    }
    if (/\bami\b/.test(a) && /\bjolie\b/.test(a)) {
      return { score: 4, focus: "Agreement", feedback: "“Ami” is masculine. Use “joli”, not “jolie”." };
    }
  }

  if (lang === "ga") {
    if (/\bta se\b/.test(a)) {
      return { score: 4, focus: "Accent", feedback: "Use “Tá sé” with a fada and accent." };
    }
  }

  return null;
}

// ---------------- FALLBACK ----------------

function fallbackCoach(answer) {
  const wc = answer.trim().split(/\s+/).length;
  if (wc < 2) return { score: 0, focus: "Start", feedback: "Write a full sentence." };
  if (wc < 4) return { score: 4, focus: "Development", feedback: "Add one more clear detail." };
  return { score: 7, focus: "Development", feedback: "Add one specific detail or reason." };
}

// ---------------- END GAME SUMMARY ----------------

function showSummary(out) {

  const avg = (roundScores.reduce((a,b)=>a+b,0) / roundScores.length).toFixed(1);

  const trend =
    roundScores[2] > roundScores[0] ? "⬆ Improving" :
    roundScores[2] < roundScores[0] ? "⬇ Declining" :
    "→ Stable";

  const bars = roundScores.map((s,i)=>
    `Round ${i+1}: ${"█".repeat(Math.max(1, Math.round(s/1.5)))}`
  ).join("<br>");

  const focusCounts = {};
  roundFocus.forEach(f => {
    focusCounts[f] = (focusCounts[f] || 0) + 1;
  });

  const weakest = Object.keys(focusCounts).sort((a,b)=>focusCounts[b]-focusCounts[a])[0];

  out.innerHTML = `
    <h3>Game Complete</h3>
    <div><strong>Scores:</strong> ${roundScores.join(", ")}</div>
    <div><strong>Average:</strong> ${avg}</div>
    <div><strong>Trend:</strong> ${trend}</div>
    <div style="margin-top:10px;">${bars}</div>
    <div style="margin-top:10px;"><strong>Main focus:</strong> ${weakest}</div>
    <div style="margin-top:10px;"><strong>Coach says:</strong> 
      Over these rounds your main focus was <b>${weakest}</b>. 
      Keep working on that and aim to push your average above ${avg}.
    </div>
    <button id="playAgain">Play Again</button>
  `;

  document.getElementById("playAgain").onclick = () => {
    round = 0;
    roundScores = [];
    roundFocus = [];
    startNewRound(out);
  };
}

// ---------------- ROUND HANDLER ----------------

function startNewRound(out) {
  currentPrompt = getRandomPrompt();
  document.getElementById("task").innerText = currentPrompt;
  document.getElementById("answer").value = "";
  document.getElementById("answer").disabled = false;
  document.getElementById("answer").focus();
  out.classList.add("hidden");
}

// ---------------- MAIN ----------------

document.addEventListener("DOMContentLoaded", () => {

  const runBtn = document.getElementById("runBtn");
  const out = document.getElementById("out");

  startNewRound(out);

  runBtn.onclick = async () => {

    const ansBox = document.getElementById("answer");
    const answer = ansBox.value.trim();
    const lang = document.getElementById("lang").value;

    ansBox.disabled = true;
    out.classList.remove("hidden");
    out.innerHTML = "Thinking…";

    let result = ruleCheck(answer, lang);

    if (!result) {
      try {
        result = await window.classifyAnswer({
          task: currentPrompt,
          answer,
          lang
        });
      } catch {
        result = fallbackCoach(answer);
      }
    }

    round++;
    roundScores.push(result.score);
    roundFocus.push(result.focus);

    out.innerHTML = `
      <div><strong>Score:</strong> ${result.score}/10</div>
      <div><strong>Coach says:</strong> ${result.feedback}</div>
      <div style="margin-top:10px;">
        <button data-v="clear">👍 Clear</button>
        <button data-v="unclear">🔁 Could be clearer</button>
        <button data-v="bad">❌ Not helpful</button>
      </div>
      <button id="nextRound">${round < CONFIG.ROUNDS ? "Next Round" : "See Results"}</button>
    `;

    out.querySelectorAll("[data-v]").forEach(btn=>{
      btn.onclick = () => {
        console.log("TEACHER FEEDBACK", {
          answer,
          result,
          rating: btn.dataset.v
        });
        btn.innerText = "✓";
        btn.disabled = true;
      };
    });

    document.getElementById("nextRound").onclick = () => {
      if (round < CONFIG.ROUNDS) {
        startNewRound(out);
      } else {
        showSummary(out);
      }
    };
  };
});
