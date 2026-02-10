// TURBO COACH — Teacher Arbiter v1

function wc(t) {
  return t.trim().split(/\s+/).length;
}

function hasVerb(t, lang) {
  t = t.toLowerCase();
  if (lang === "es") return /\b(es|está|eres|tiene|vive|gustan|gusta)\b/.test(t);
  if (lang === "fr") return /\b(est|a|habite|aime)\b/.test(t);
  if (lang === "de") return /\b(ist|hat|wohnt|mag)\b/.test(t);
  if (lang === "ga") return /\b(tá|is)\b/.test(t);
  return false;
}

function hasConnector(t) {
  return /\b(y|et|und|agus|pero|parce que|weil|porque)\b/i.test(t);
}

function hasOpinion(t, lang) {
  t = t.toLowerCase();
  if (lang === "es") return /\b(creo que|porque)\b/.test(t);
  if (lang === "fr") return /\b(je pense que|parce que)\b/.test(t);
  if (lang === "de") return /\b(ich denke|weil)\b/.test(t);
  if (lang === "ga") return /\b(sílim go|mar go)\b/.test(t);
  return false;
}

function coach(answer, lang) {

  if (!hasVerb(answer, lang)) {
    return { score: 0, focus: "Start", msg: "Add a verb to make a sentence." };
  }

  if (wc(answer) <= 2) {
    return { score: 2, focus: "Fragment", msg: "Good start. Write a full sentence." };
  }

  if (!hasConnector(answer) && !hasOpinion(answer, lang)) {
    return { score: 5, focus: "Development", msg: "This works. Add another detail." };
  }

  if (!hasOpinion(answer, lang)) {
    return {
      score: 7,
      focus: "Competence",
      msg: "Add an opinion or reason (e.g. Creo que…, parce que…, weil…)."
    };
  }

  return {
    score: 8,
    focus: "Strong",
    msg: "Very good. Check accuracy and add one more specific detail."
  };
}

// ================= UI + Teacher Arbiter =================

document.addEventListener("DOMContentLoaded", () => {

  const btn = document.getElementById("runBtn");
  const out = document.getElementById("out");
  const ans = document.getElementById("answer");

  btn.onclick = () => {
    const lang = document.getElementById("lang").value;
    const answer = ans.value.trim();
    const r = coach(answer, lang);

    out.classList.remove("hidden");
    ans.disabled = true;

    out.innerHTML = `
      <div><strong>Score:</strong> ${r.score}/10</div>
      <div><strong>Focus:</strong> ${r.focus}</div>
      <div><strong>Do this:</strong> ${r.msg}</div>

      <div class="teacher">
        <button data-v="fair">👍 Fair</button>
        <button data-v="harsh">⬆ Too harsh</button>
        <button data-v="soft">⬇ Too generous</button>
      </div>

      <button id="retry">Try again</button>
    `;

    document.getElementById("retry").onclick = () => {
      ans.value = "";
      ans.disabled = false;
      ans.focus();
      out.classList.add("hidden");
    };

    out.querySelectorAll(".teacher button").forEach(b => {
      b.onclick = () => {
        console.log("TEACHER FEEDBACK:", b.dataset.v, answer, r);
        b.innerText = "✔";
        b.disabled = true;
      };
    });
  };
});
