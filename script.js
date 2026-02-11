// TURBO COACH — HYBRID RULE + AI ENGINE

function fallbackCoach(answer) {
  const wc = answer.trim().split(/\s+/).length;

  if (wc < 2) {
    return { score: 0, focus: "Start", feedback: "Write a full sentence." };
  }

  if (wc < 4) {
    return { score: 4, focus: "Development", feedback: "Add one more clear detail." };
  }

  return { score: 7, focus: "Development", feedback: "Add a specific detail or reason." };
}

// ---------- RULE ENGINE ----------

function ruleCheck(answer, lang) {
  const a = answer.toLowerCase().trim();

  // Spanish person mismatch
  if (lang === "es") {
    if (/\bmi amigo\b/.test(a) && /\beres\b/.test(a)) {
      return {
        score: 3,
        focus: "Verb agreement",
        feedback: "“Eres” is for 'you'. Use “es” for 'he'.",
      };
    }
  }

  // French apostrophe
  if (lang === "fr") {
    if (/\bcest\b/.test(a)) {
      return {
        score: 4,
        focus: "Apostrophe",
        feedback: "Use “c’est” with an apostrophe.",
      };
    }
    if (/\bami\b/.test(a) && /\bjolie\b/.test(a)) {
      return {
        score: 4,
        focus: "Agreement",
        feedback: "“Ami” is masculine. Use “joli”, not “jolie”.",
      };
    }
  }

  // Irish fada
  if (lang === "ga") {
    if (/\bta se\b/.test(a)) {
      return {
        score: 4,
        focus: "Accent",
        feedback: "Use “Tá sé” with a fada and accent.",
      };
    }
  }

  return null;
}

// ---------- MAIN ----------

document.addEventListener("DOMContentLoaded", () => {

  const runBtn = document.getElementById("runBtn");
  const out = document.getElementById("out");
  const ans = document.getElementById("answer");

  runBtn.onclick = async () => {

    const answer = ans.value.trim();
    const lang = document.getElementById("lang").value;

    ans.disabled = true;
    out.classList.remove("hidden");
    out.innerHTML = "Thinking…";

    // 1️⃣ RULE FIRST
    let result = ruleCheck(answer, lang);

    // 2️⃣ AI SECOND
    if (!result) {
      try {
        result = await window.classifyAnswer({
          task: "Describe your best friend",
          answer,
          lang
        });
      } catch (e) {
        console.warn("AI failed, using fallback");
      }
    }

    // 3️⃣ FALLBACK
    if (!result) {
      result = fallbackCoach(answer);
    }

    out.innerHTML = `
      <div><strong>Score:</strong> ${result.score}/10</div>
      <div><strong>Focus:</strong> ${result.focus}</div>
      <div><strong>Do this:</strong> ${result.feedback}</div>

      <div class="teacherBar">
        <button data-v="clear">👍 Clear</button>
        <button data-v="unclear">🔁 Could be clearer</button>
        <button data-v="bad">❌ Not helpful</button>
      </div>

      <button id="retry">Try again</button>
    `;

    out.querySelectorAll(".teacherBar button").forEach(btn => {
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

    document.getElementById("retry").onclick = () => {
      ans.value = "";
      ans.disabled = false;
      ans.focus();
      out.classList.add("hidden");
    };
  };
});
