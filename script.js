// TURBO COACH — AI CLASSIFIER WITH SAFE FALLBACK
// No imports. GitHub Pages safe.

function fallbackCoach(answer) {
  const wc = answer.trim().split(/\s+/).length;

  if (wc < 2) {
    return {
      score: 0,
      focus: "Start",
      feedback: "Write a full sentence."
    };
  }

  if (wc < 4) {
    return {
      score: 5,
      focus: "Development",
      feedback: "Good start. Add another detail."
    };
  }

  return {
    score: 7,
    focus: "Development",
    feedback: "Good answer. Add an opinion or reason."
  };
}

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

    let result = null;

    // TRY AI FIRST
    try {
      result = await window.classifyAnswer({
        task: "Describe your best friend",
        answer: answer,
        lang: lang
      });
    } catch (e) {
      console.warn("AI failed, using fallback");
    }

    // FALLBACK IF AI FAILS
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

    // TEACHER ARBITER (optional, silent)
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
