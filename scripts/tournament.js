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
  const fixtures = [...document.querySelectorAll("li[data-team-a]")].map(
    (f) => ({
      teamA: f.dataset.teamA,
      teamB: f.dataset.teamB,
      scoreA: f.dataset.scoreA,
      scoreB: f.dataset.scoreB,
    })
  );
  localStorage.setItem("fixtures", JSON.stringify(fixtures));
}

function loadFromLocalStorage() {
  const saved = JSON.parse(localStorage.getItem("fixtures") || "[]");
  saved.forEach(({ teamA, teamB, scoreA, scoreB }) => {
    const match = [...document.querySelectorAll("li[data-team-a]")].find(
      (f) => f.dataset.teamA === teamA && f.dataset.teamB === teamB
    );
    if (match) {
      match.dataset.scoreA = scoreA;
      match.dataset.scoreB = scoreB;
    }
  });
}

function addResultInputs() {
  console.log("Adding inputs to fixtures...");
  const fixtures = document.querySelectorAll("li[data-team-a]");
  console.log("fixtures found:", fixtures.length);
  fixtures.forEach((fix, index) => {
    if (fix.querySelector("input")) return;

    const inputA = document.createElement("input");
    const inputB = document.createElement("input");
    const button = document.createElement("button");

    inputA.type = "number";
    inputB.type = "number";
    inputA.placeholder = "A";
    inputB.placeholder = "B";
    inputA.className = "score-input";
    inputB.className = "score-input";
    button.textContent = "Save";
    button.className = "save-btn";

    button.addEventListener("click", () => {
      if (inputA.value === "" || inputB.value === "") return;
      fix.dataset.scoreA = inputA.value;
      fix.dataset.scoreB = inputB.value;
      saveToLocalStorage();
      updateTables();
    });

    fix.appendChild(inputA);
    fix.appendChild(inputB);
    fix.appendChild(button);
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
  console.log("Updating tables...");
  const fixtures = document.querySelectorAll("li[data-team-a]");
  console.log("fixtures found:", fixtures.length);
  const tables = {
    group1: initTable(groups.group1),
    group2: initTable(groups.group2),
  };

  fixtures.forEach((fix) => {
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

    teamA.pl++;
    teamB.pl++;
    teamA.gf += sA;
    teamA.ga += sB;
    teamB.gf += sB;
    teamB.ga += sA;

    if (sA > sB) {
      teamA.w++;
      teamB.l++;
      teamA.pts += 3;
    } else if (sB > sA) {
      teamB.w++;
      teamA.l++;
      teamB.pts += 3;
    } else {
      teamA.d++;
      teamB.d++;
      teamA.pts += 1;
      teamB.pts += 1;
    }

    teamA.gd = teamA.gf - teamA.ga;
    teamB.gd = teamB.gf - teamB.ga;
  });

  ["group1", "group2"].forEach((g) => {
    const body = document.getElementById(`${g}-body`);
    body.innerHTML = "";

    const sorted = Object.values(tables[g]).sort(
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

document.addEventListener("DOMContentLoaded", () => {
  loadFromLocalStorage();
  addResultInputs();
  updateTables();
});
