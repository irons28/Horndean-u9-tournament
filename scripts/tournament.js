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
  const fixtures = document.querySelectorAll("li[data-team-a]");
  fixtures.forEach(fix => {
    if (fix.querySelector('input')) return; // Avoid duplicates

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "e.g. 2-1";
    input.className = "score-input";
    input.style.display = "none"; // hidden by default

    input.addEventListener("blur", () => {
      const [scoreA, scoreB] = input.value.split("-").map(s => s.trim());
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

function allLeagueMatchesCompleted() {
  const fixtures = [...document.querySelectorAll("li[data-team-a]")];
  return fixtures.every(fix => fix.dataset.scoreA !== "" && fix.dataset.scoreB !== "");
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
      teamA.d++; teamB.d++; teamA.pts++; teamB.pts++;
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
  updateFinalMatch(tables);
}

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

function updateFinalMatch(tables) {
  const finalSection = document.getElementById("final-match");
  const leagueComplete = allLeagueMatchesCompleted();

  let group1WinnerText = "Winner Group 1";
  let group2WinnerText = "Winner Group 2";

  if (leagueComplete) {
    group1WinnerText = Object.values(tables.group1).sort(
      (a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf
    )[0].team;

    group2WinnerText = Object.values(tables.group2).sort(
      (a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf
    )[0].team;
  }

  finalSection.innerHTML = `
    <h2>Final</h2>
    <ul>
      <li id="final-match-li" data-team-a="${group1WinnerText}" data-team-b="${group2WinnerText}" data-score-a="" data-score-b="">
        <strong>13:05 Pitch 1:</strong> 
        <span class="team-name">${group1WinnerText}</span>
        <input type="text" id="final-score-input" placeholder="e.g. 2-1" class="score-input" style="display:none; margin-left: 10px; width: 60px;">
        <span class="result" id="final-result" style="margin-left: 10px; font-weight: bold;">-</span>
        <span style="margin-left: 10px;">Vs</span>
        <span class="team-name">${group2WinnerText}</span>
      </li>
    </ul>
  `;

  const finalMatchLi = document.getElementById("final-match-li");
  const finalScoreInput = document.getElementById("final-score-input");
  const finalResultSpan = document.getElementById("final-result");

  const savedFinalScore = loadFinalFromLocalStorage();
  if (savedFinalScore.scoreA !== "" && savedFinalScore.scoreB !== "") {
    finalMatchLi.dataset.scoreA = savedFinalScore.scoreA;
    finalMatchLi.dataset.scoreB = savedFinalScore.scoreB;
    finalResultSpan.textContent = `${savedFinalScore.scoreA} - ${savedFinalScore.scoreB}`;
    finalScoreInput.value = `${savedFinalScore.scoreA} - ${savedFinalScore.scoreB}`;
  } else {
    finalResultSpan.textContent = "-";
    finalScoreInput.value = "";
  }

  const isAdmin = document.getElementById("reset-btn").style.display === "inline-block";
  finalScoreInput.style.display = isAdmin ? "inline-block" : "none";

  finalScoreInput.addEventListener("blur", () => {
    const val = finalScoreInput.value.trim();
    const parts = val.split("-").map(s => s.trim());
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      finalMatchLi.dataset.scoreA = parts[0];
      finalMatchLi.dataset.scoreB = parts[1];
      finalResultSpan.textContent = `${parts[0]} - ${parts[1]}`;
      saveFinalToLocalStorage(parts[0], parts[1]);
    } else if (val === "") {
      finalMatchLi.dataset.scoreA = "";
      finalMatchLi.dataset.scoreB = "";
      finalResultSpan.textContent = "-";
      saveFinalToLocalStorage("", "");
    } else {
      finalResultSpan.textContent = "Invalid format";
    }
  });
}

document.getElementById("admin-btn").addEventListener("click", () => {
  document.getElementById("admin-login").style.display = "block";
  document.getElementById("admin-btn").style.display = "none";
});

function checkAdminPassword() {
  const passwordInput = document.getElementById("admin-password");
  const password = passwordInput.value.trim();

  if (password === "horndean2025") {
    enableAdminMode();
    passwordInput.value = "";
    document.getElementById("reset-btn").style.display = "inline-block";
  } else {
    alert("Incorrect password!");
  }
}

function enableAdminMode() {
  document.querySelectorAll(".score-input").forEach(el => {
    el.style.display = "inline-block";
  });
  const finalScoreInput = document.getElementById("final-score-input");
  if (finalScoreInput) {
    finalScoreInput.style.display = "inline-block";
  }
}

function resetScores() {
  if (!confirm("Are you sure you want to reset all scores? This cannot be undone.")) return;

  const fixtures = document.querySelectorAll("li[data-team-a]");
  fixtures.forEach(fix => {
    fix.dataset.scoreA = "";
    fix.dataset.scoreB = "";
  });

  localStorage.removeItem("fixtures");
  localStorage.removeItem("finalMatch");

  document.querySelectorAll(".score-input").forEach(el => {
    el.style.display = "none";
    el.value = "";
  });

  const finalScoreInput = document.getElementById("final-score-input");
  if(finalScoreInput) finalScoreInput.value = "";
  const finalResultSpan = document.getElementById("final-result");
  if(finalResultSpan) finalResultSpan.textContent = "-";

  document.getElementById("reset-btn").style.display = "none";
  document.getElementById("admin-login").style.display = "none";
  document.getElementById("admin-btn").style.display = "inline-block";

  updateTables();
}

document.getElementById("reset-btn").addEventListener("click", resetScores);

// Expose checkAdminPassword globally since it's called inline in HTML
window.checkAdminPassword = checkAdminPassword;

document.addEventListener("DOMContentLoaded", () => {
  loadFromLocalStorage();
  addResultInputs();
  updateTables();
});