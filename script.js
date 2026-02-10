// TURBO COACH — CALIBRATED + TEACHER ARBITER
// Deterministic. Classroom-safe. No AI.

// =====================
// FEEDBACK BANK
// =====================
const FEEDBACK_BANK = {
  noVerb: [
    "You need a verb to make a sentence. Start with **es** (he is) or **tiene** (he has)."
  ],
  wrongPerson: [
    "You’ve used a verb, but it’s the wrong person. Say **es** (he is), not **eres** (you are).",
    "Good attempt — change the verb to third person: **es**, not **eres**."
  ],
  fragment: [
    "Good start. Write a full sentence about the person."
  ],
  develop: [
    "This works. Add one more detail about the person.",
    "Correct sentence. Say one more thing (appearance, personality, place…)."
  ],
  opinion: [
    "Good answer. Add an opinion or reason — try **Creo que…** or **porque…**."
  ],
  strong: [
    "Very good. Check accuracy and add one more specific detail."
  ]
};

// =====================
// HELPERS
// =====================
function wc(t) {
  return t.trim().split(/\s+/).length;
}

// Any verb attempt (even wrong person)
function hasAnyVerbAttempt(t, lang) {
  t = t.toLowerCase();
  if (lang === "es") return /\b(es|está|eres|soy|somos|tiene|tengo|vive|vives|gusta|gustas)\b/.test(t);
  if (lang === "fr") return /\b(est|es|suis|a|as|habite|habites|aime|aimes)\b/.test(t);
  if (lang === "de") return /\b(ist|bin|bist|hat|habe|hast|wohnt|wohnst|mag|magst)\b/.test(t);
  if (lang === "ga") return /\b(tá|is|táim|táimid)\b/.test(t);
  return false;
}

// Correct person for task (3rd person)
function hasCorrectPersonVerb(t, lang) {
  t = t.toLowerCase();
  if (lang === "es") return /\b(es|está|tiene|vive|gusta|gustan)\b/.test(t);
  if (lang === "fr") return /\b(est|a|habite|aime)\b/.test(t);
  if (lang === "de") return /\b(ist|hat|wohnt|mag)\b/.test(t);
  if (lang === "ga") return /\b(tá|is)\b/.test(t);
  return false;
}

function hasConnector(t) {
  return /\b(y|et|und|agus|pero|porque|parce que|weil)\b/i.test(t);
}

function hasOpinion(t, lang) {
  t = t.toLowerCase();
  if (lang === "es") return /\b(creo que|porque)\b/.test(t);
  if (lang === "fr") return /\b(je pense que|parce que)\b/.test(t);
  if (lang === "de") return /\b(ich denke|weil)\b/.test(t);
  if (lang === "ga") return /\b(sílim go|mar go)\b/.test(t);
  return false;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// =====================
// COACH ENGINE
// =====================
function coach(answer, lang) {

  if (!hasAnyVerbAttempt(answer, lang)) {
    return { score: 0, focus: "Start", key: "noVerb" };
  }

  if (!hasCorrectPersonVerb(answer, lang)) {
    return { score: 0, focus: "Verb form", key: "wrongPerson" };
  }

  if (wc(answer) <= 3) {
    return { score: 2, focus: "Fragment", key: "fragment" };
  }

  if (!hasConnector(answer) && !hasOpinion(answer, lang)) {
    return { score: 5, focus: "Development", key: "develop" };
  }

  if (!hasOpinion(answer, lang)) {
    return { score: 7, focus: "Competence", key: "opinion" };
  }

  return { score: 8, focus: "Strong", key: "strong" };
}

// =====================
// UI + TEACHER ARBITER
// =====================
document.addEventListener("DOMContentLoaded", () => {

  const runBtn = document.getElementById("runBtn");
  const out = document.getElementById("out");
  const ans = document.getElementById("answer");

  runBtn.onclick = () => {
    const lang = document.getElementById("lang").value;
    const answer = ans.value.trim();
    const r = coach(answer, lang);
    const feedback = pick(FEEDBACK_BANK[r.key]);

    ans.disabled = true;

    out.classList.remove("hidden");
    out.innerHTML = `
      <div><strong>Score:</strong> ${r.score}/10</div>
      <div><strong>Focus:</strong> ${r.focus}</div>
      <div><strong>Do this:</strong> ${feedback}</div>

      <div class="teacherBar">
        <button data-v="clear">👍 Clear</button>
        <button data-v="unclear">🔁 Could be clearer</button>
        <button data-v="bad">❌ Not helpful</button>
      </div>

      <button id="retry">Try again</button>
    `;

    out.querySelectorAll(".teacherBar button").forEach(b => {
      b.onclick = () => {
        console.log("TEACHER FEEDBACK", {
          key: r.key,
          phrasing: feedback,
          rating: b.dataset.v
        });
        b.innerText = "✓";
        b.disabled = true;
      };
    });

    document.getElementById("retry").onclick = () => {
      ans.value = "";
      ans.disabled = false;
      ans.focus();
      out.classList.add("hidden");
    };
  };
});
