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
    } else if (span) {
      span.textContent = " - ";
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
}

function enableAdminMode() {
  document.querySelectorAll(".score-input").forEach(el => {
    el.style.display = "inline-block";
  });
  document.getElementById("admin-btn").style.display = "none";
  document.getElementById("admin-login").style.display = "none";

  // Show reset button
  const resetBtn = document.getElementById("reset-btn");
  if (resetBtn) resetBtn.style.display = "inline-block";
}

function checkAdminPassword() {
  const passwordInput = document.getElementById("admin-password");
  const password = passwordInput.value.trim();

  if (password === "horndean2025") {
    enableAdminMode();
    passwordInput.value = "";
  } else {
    alert("Incorrect password!");
  }
}

function resetScores() {
  // Clear dataset scores on all fixtures
  const fixtures = document.querySelectorAll("li[data-team-a]");
  fixtures.forEach(fix => {
    fix.dataset.scoreA = "";
    fix.dataset.scoreB = "";
    const input = fix.querySelector(".score-input");
    if (input) input.value = "";
  });

  // Clear localStorage
  localStorage.removeItem("fixtures");

  // Update tables and results display
  updateTables();
}

// Your existing functions: initTable(), saveToLocalStorage(), etc.
// ...

function checkAdminPassword() {
  const passwordInput = document.getElementById("admin-password");
  const password = passwordInput.value.trim();

  if (password === "horndean2025") {
    enableAdminMode();
    passwordInput.value = "";

    // Show reset button when password correct
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

function resetScores() {
  if (!confirm("Are you sure you want to reset all scores? This cannot be undone.")) return;

  const fixtures = document.querySelectorAll("li[data-team-a]");
  fixtures.forEach(fix => {
    fix.dataset.scoreA = "";
    fix.dataset.scoreB = "";
  });

  localStorage.removeItem("fixtures");

  document.querySelectorAll(".score-input").forEach(el => {
    el.style.display = "none";
    el.value = "";
  });

  updateTables();

  // Reset admin UI if needed
  // document.getElementById("reset-btn").style.display = "none";
  // document.getElementById("admin-login").style.display = "none";
  // document.getElementById("admin-btn").style.display = "inline-block";
}

// Wait for DOM to be ready
document.addEventListener("DOMContentLoaded", () => {
  loadFromLocalStorage();
  addResultInputs();
  updateTables();

  // Show password input area when "Enter Scores" clicked
  document.getElementById("admin-btn").addEventListener("click", () => {
    document.getElementById("admin-login").style.display = "block";
    document.getElementById("admin-btn").style.display = "none";
  });

  // Hook up the reset button
  document.getElementById("reset-btn").addEventListener("click", resetScores);
});