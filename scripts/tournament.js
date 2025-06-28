const groups = {
  group1: ["Horndean Sunday", "Meon Milton", "Havant & Waterlooville"],
  group2: ["Horndean Saturday", "Pickwick Lions", "Clanfield Blues"],
};

function initTable(teams) {
  return teams.reduce((acc, t) => {
    acc[t] = { team: t, pl: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 };
    return acc;
  }, {});
}

function saveToLocalStorage() {
  const fixtures = [...document.querySelectorAll("li[data-team-a]")].map(f => ({
    teamA: f.dataset.teamA,
    teamB: f.dataset.teamB,
    scoreA: f.dataset.scoreA,
    scoreB: f.dataset.scoreB,
  }));
  localStorage.setItem("fixtures", JSON.stringify(fixtures));
}

function loadFromLocalStorage() {
  const saved = JSON.parse(localStorage.getItem("fixtures") || "[]");
  saved.forEach(({ teamA, teamB, scoreA, scoreB }) => {
    const match = [...document.querySelectorAll("li[data-team-a]")].find(
      f => f.dataset.teamA === teamA && f.dataset.teamB === teamB
    );
    if (match) {
      match.dataset.scoreA = scoreA;
      match.dataset.scoreB = scoreB;
    }
  });
}

function addResultInputs() {
  const fixtures = document.querySelectorAll('li[data-team-a]');
  fixtures.forEach((fix, index) => {
    if (fix.querySelector('input')) return;

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'e.g. 2-1';
    input.className = 'score-input';
    input.style.display = "none";

    input.addEventListener('blur', () => {
      const [scoreA, scoreB] = input.value.split('-').map(s => s.trim());
      if (!isNaN(scoreA) && !isNaN(scoreB)) {
        fix.dataset.scoreA = scoreA;
        fix.dataset.scoreB = scoreB;
        saveToLocalStorage();
        updateTables();
      }
    });

    fix.appendChild(input);
  });
}

function updateMatchResultsInline() {
  const fixtures = document.querySelectorAll("li[data-team-a]");
  fixtures.forEach((fix, index) => {
    const sa = fix.dataset.scoreA;
    const sb = fix.dataset.scoreB;
    const span = document.getElementById(`r${index}`);
    if (span && sa !== "" && sb !== "") {
      span.textContent = `${sa} - ${sb}`;
    }
  });
}

function updateTables() {
  const fixtures = document.querySelectorAll("li[data-team-a]");
  const tables = {
    group1: initTable(groups.group1),
    group2: initTable(groups.group2),
  };

  fixtures.forEach(fix => {
    const a = fix.dataset.teamA;
    const b = fix.dataset.teamB;
    const sa = fix.dataset.scoreA;
    const sb = fix.dataset.scoreB;
    if (sa === "" || sb === "") return;

    const sA = parseInt(sa);
    const sB = parseInt(sb);
    if (isNaN(sA) || isNaN(sB)) return;

    const group = groups.group1.includes(a) ? "group1" : "group2";
    const teamA = tables[group][a];
    const teamB = tables[group][b];

    teamA.pl++; teamB.pl++;
    teamA.gf += sA; teamA.ga += sB;
    teamB.gf += sB; teamB.ga += sA;

    if (sA > sB) {
      teamA.w++; teamB.l++; teamA.pts += 3;
    } else if (sB > sA) {
      teamB.w++; teamA.l++; teamB.pts += 3;
    } else {
      teamA.d++; teamB.d++; teamA.pts += 1; teamB.pts += 1;
    }

    teamA.gd = teamA.gf - teamA.ga;
    teamB.gd = teamB.gf - teamB.ga;
  });

  ["group1", "group2"].forEach(group => {
    const body = document.getElementById(`${group}-body`);
    body.innerHTML = "";

    const sorted = Object.values(tables[group]).sort(
      (a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf
    );

    sorted.forEach((t, i) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${t.team}</td><td>${t.pl}</td><td>${t.w}</td><td>${t.d}</td><td>${t.l}</td>
        <td>${t.gf}</td><td>${t.ga}</td><td>${t.gd}</td><td>${t.pts}</td>
      `;
      if (i === 0) tr.classList.add("group-leader");
      body.appendChild(tr);
    });
  });

  updateMatchResultsInline();

  // Update final match after tables updated
  updateFinalMatch(tables);
}

// Show the password input area when "Enter Scores" clicked
document.getElementById("admin-btn").addEventListener("click", () => {
  document.getElementById("admin-login").style.display = "block";
  document.getElementById("admin-btn").style.display = "none";
});

// Check admin password, show inputs and reset button on success
function checkAdminPassword() {
  const passwordInput = document.getElementById("admin-password");
  const password = passwordInput.value.trim();

  if (password === "horndean2025") {
    enableAdminMode();
    passwordInput.value = "";
    // Optionally hide login area or keep visible
    // document.getElementById("admin-login").style.display = "none";

    // Show reset button
    document.getElementById("reset-btn").style.display = "inline-block";
  } else {
    alert("Incorrect password!");
  }
}

function enableAdminMode() {
  document.querySelectorAll(".score-input").forEach(el => {
    el.style.display = "inline-block";
  });
}

// Reset all scores and clear localStorage
function resetScores() {
  if (!confirm("Are you sure you want to reset all scores? This cannot be undone.")) return;

  const fixtures = document.querySelectorAll("li[data-team-a]");
  fixtures.forEach(fix => {
    fix.dataset.scoreA = "";
    fix.dataset.scoreB = "";
  });

  // Clear localStorage
  localStorage.removeItem("fixtures");
  localStorage.removeItem("finalMatch");

  // Hide score inputs and clear input values
  document.querySelectorAll(".score-input").forEach(el => {
    el.style.display = "none";
    el.value = "";
  });

  // Clear final match inputs too
  const finalScoreInput = document.getElementById("final-score");
  if(finalScoreInput) {
    finalScoreInput.value = "";
  }
  const finalResultSpan = document.getElementById("final-result");
  if(finalResultSpan) {
    finalResultSpan.textContent = "";
  }

  // Reset admin UI if needed
  document.getElementById("reset-btn").style.display = "none";
  document.getElementById("admin-login").style.display = "none";
  document.getElementById("admin-btn").style.display = "inline-block";

  updateTables();
}

// Hook reset button event
document.getElementById("reset-btn").addEventListener("click", resetScores);

// Save/load final match score from localStorage
function saveFinalToLocalStorage(finalScoreA, finalScoreB) {
  localStorage.setItem("finalMatch", JSON.stringify({scoreA: finalScoreA, scoreB: finalScoreB}));
}

function loadFinalFromLocalStorage() {
  const saved = JSON.parse(localStorage.getItem("finalMatch"));
  if (saved) {
    return { scoreA: saved.scoreA, scoreB: saved.scoreB };
  }
  return { scoreA: "", scoreB: "" };
}

// Update final match UI with winners and input
function updateFinalMatch(tables) {
  const group1Winner = Object.values(tables.group1).sort(
    (a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf
  )[0].team;

  const group2Winner = Object.values(tables.group2).sort(
    (a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf
  )[0].team;

  const finalSection = document.getElementById("final-match");
  finalSection.innerHTML = `
    <h2>Final</h2>
    <ul>
      <li>
        <strong>13:05 Pitch 1: ${group1Winner} vs ${group2Winner}</strong>
        <input type="text" id="final-score" placeholder="e.g. 2-1" style="margin-left:10px; width:60px;">
        <span id="final-result" style="margin-left:10px; font-weight:bold;"></span>
      </li>
    </ul>
  `;

  const finalScoreInput = document.getElementById("final-score");
  const finalResultSpan = document.getElementById("final-result");

  // Load saved final score if any
  const savedFinalScore = loadFinalFromLocalStorage();
  if (savedFinalScore.scoreA !== "" && savedFinalScore.scoreB !== "") {
    finalScoreInput.value = `${savedFinalScore.scoreA} - ${savedFinalScore.scoreB}`;
    finalResultSpan.textContent = `${savedFinalScore.scoreA} - ${savedFinalScore.scoreB}`;
  }

  // Enable input only if admin mode is active
  if (document.querySelectorAll(".score-input").length > 0 && document.querySelector(".score-input")[0].style.display === "inline-block") {
    finalScoreInput.style.display = "inline-block";
  } else {
    finalScoreInput.style.display = "none";
  }

  // Save and update on blur
  finalScoreInput.addEventListener("blur", () => {
    const val = finalScoreInput.value;
    const parts = val.split("-").map(s => s.trim());
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      finalResultSpan.textContent = `${parts[0]} - ${parts[1]}`;
      saveFinalToLocalStorage(parts[0], parts[1]);
    } else {
      finalResultSpan.textContent = "Invalid format";
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  loadFromLocalStorage();
  addResultInputs();
  updateTables();
});

