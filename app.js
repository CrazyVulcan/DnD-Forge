const STORAGE_KEY = "situation-forge-state-v1";
const MAX_PARTY_SIZE = 4;
const MAX_WEATHER_HISTORY_LENGTH = 3;

const TABLES = {
  environments: [
    "sunken archive beneath a ruined abbey",
    "fog-lashed cliff shrine with broken bells",
    "overgrown road watched by old gallows",
    "flooded quarry turned into a camp",
    "abandoned watchtower over black pines"
  ],
  pressures: [
    "a ritual timer is almost spent",
    "supplies are vanishing between watches",
    "a trusted guide has gone missing",
    "two local powers demand immediate allegiance",
    "the route out is collapsing behind you"
  ],
  oppositions: [
    "a starving warband with strict orders",
    "a masked inquisitorial cell",
    "territorial grave-hounds",
    "a sorcerer marked by forbidden oaths",
    "an unseen thing that imitates voices"
  ],
  twists: [
    "the apparent enemy is fleeing something worse",
    "an ally is carrying a hidden geas",
    "the objective is bait for a larger trap",
    "the weather itself answers to a relic nearby",
    "the threat is tied to a party member's past"
  ],
  choices: [
    "protect innocents and lose tactical ground",
    "strike first and risk exposing your position",
    "parley for time while doom advances",
    "split the party to secure two failing fronts",
    "burn evidence to prevent wider panic"
  ],
  escalations: [
    "if delayed, local roads close and reinforcements arrive",
    "if ignored, the faction seizes key hostages",
    "if stalled, corruption spreads into nearby sanctuaries",
    "if postponed, weather turns travel into attrition",
    "if abandoned, rumors brand the party as oathbreakers"
  ],
  discoveries: [
    "a coded map margin naming an unmarked vault",
    "a survivor's confession that rewrites blame",
    "a branded token linking two rival factions",
    "a damaged prophecy page missing one vital line",
    "an old census proving the settlement was relocated"
  ],
  roomTypes: ["ritual chamber", "collapsed barracks", "scribe vault", "fungal cistern", "forgotten chapel"],
  terrain: ["uneven stone and root tangles", "slick timber walkways", "ash and cinder drifts", "standing black water"],
  exits: ["one sealed stair and a crawlspace", "three archways with faded sigils", "a rope lift and a cracked tunnel"],
  details: ["cartographic murals scratched with warnings", "candle stubs around a chalk circle", "war banners stitched with wrong heraldry"],
  hazards: ["spore clouds that induce fevered dreams", "unstable masonry above choke points", "sacred wards that punish loud speech"],
  sensory: ["smells of wet vellum and iron", "a distant bell tolls without rhythm", "air tastes of smoke and old coins"],
  weather: ["cold rain", "sulfur wind", "still fog", "hail in brief bursts", "dry thunder"],
  factionNames: ["Ashen Banner", "Pale Ledger", "Thorn Concord", "Order of the Hollow Sun", "Glass Choir"],
  factionGoals: ["control relic traffic", "erase forbidden histories", "annex border shrines", "weaponize prophecy", "break a dynastic truce"],
  factionActions: ["bribing sentries", "moving prisoners by night", "forging decrees", "hunting a witness", "arming mercenaries"]
};

const state = loadState() || {
  world: {
    region: "",
    dangerLevel: 2,
    factionPressure: 2,
    timeDay: "",
    weather: "",
    doom: 0,
    activeThreat: "",
    campaignNotes: ""
  },
  party: [],
  factions: [],
  log: [],
  situationCount: 0
};

const $ = (id) => document.getElementById(id);

function rand(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function randomVariation() {
  return Math.floor(Math.random() * 2) - 1;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

function logEntry(type, text) {
  const stamp = new Date().toLocaleString();
  state.log.unshift({ type, text, stamp });
  state.log = state.log.slice(0, 80);
  renderLog();
  saveState();
}

function renderWorld() {
  $("region").value = state.world.region;
  $("dangerLevel").value = state.world.dangerLevel;
  $("factionPressure").value = state.world.factionPressure;
  $("timeDay").value = state.world.timeDay;
  $("weather").value = state.world.weather;
  $("doom").value = state.world.doom;
  $("activeThreat").value = state.world.activeThreat;
  $("campaignNotes").value = state.world.campaignNotes;
}

function captureWorld() {
  state.world = {
    region: $("region").value.trim(),
    dangerLevel: Number($("dangerLevel").value),
    factionPressure: Number($("factionPressure").value),
    timeDay: $("timeDay").value.trim(),
    weather: $("weather").value.trim(),
    doom: Number($("doom").value) || 0,
    activeThreat: $("activeThreat").value.trim(),
    campaignNotes: $("campaignNotes").value.trim()
  };
  saveState();
}

function renderParty() {
  const root = $("partyList");
  root.innerHTML = "";

  state.party.forEach((member, index) => {
    const card = document.createElement("div");
    card.className = "member-card";
    card.innerHTML = `
      <div class="grid two">
        <label>Name <input data-k="name" data-i="${index}" value="${escapeHtml(member.name)}"></label>
        <label>Class/Archetype <input data-k="archetype" data-i="${index}" value="${escapeHtml(member.archetype)}"></label>
        <label>Level <input data-k="level" data-i="${index}" type="number" min="1" value="${escapeHtml(member.level || 1)}"></label>
        <label>HP / Max HP <input data-k="hp" data-i="${index}" value="${escapeHtml(member.hp)}" placeholder="9/12"></label>
        <label>Stress/Injury <input data-k="stress" data-i="${index}" value="${escapeHtml(member.stress)}"></label>
        <label>Inventory <input data-k="inventory" data-i="${index}" value="${escapeHtml(member.inventory)}"></label>
      </div>
      <label>Notes <textarea data-k="notes" data-i="${index}" rows="2">${escapeHtml(member.notes)}</textarea></label>
      <button data-remove="${index}">Remove</button>
    `;
    root.appendChild(card);
  });

  root.querySelectorAll("input, textarea").forEach((field) => {
    field.addEventListener("change", (event) => {
      const i = Number(event.target.dataset.i);
      const k = event.target.dataset.k;
      state.party[i][k] = event.target.value;
      saveState();
    });
  });

  root.querySelectorAll("button[data-remove]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.party.splice(Number(btn.dataset.remove), 1);
      renderParty();
      saveState();
      logEntry("party", "A party member record was removed.");
    });
  });
}

function renderFactions() {
  const list = $("factionList");
  list.innerHTML = "";
  state.factions.forEach((faction, i) => {
    const li = document.createElement("li");
    li.textContent = `${faction.name} — Goal: ${faction.goal}; Hostility ${faction.hostility}/5; Influence ${faction.influence}/5; Action: ${faction.action}`;
    li.title = `Faction ${i + 1}`;
    list.appendChild(li);
  });
}

function renderLog() {
  const list = $("campaignLog");
  list.innerHTML = "";
  state.log.forEach((entry) => {
    const li = document.createElement("li");
    li.textContent = `[${entry.stamp}] ${entry.type.toUpperCase()}: ${entry.text}`;
    list.appendChild(li);
  });
}

function generateFaction() {
  const faction = {
    name: rand(TABLES.factionNames),
    goal: rand(TABLES.factionGoals),
    hostility: Math.min(5, Math.max(1, state.world.dangerLevel + randomVariation())),
    influence: Math.min(5, Math.max(1, state.world.factionPressure + randomVariation())),
    action: rand(TABLES.factionActions)
  };
  state.factions.push(faction);
  renderFactions();
  saveState();
  logEntry("faction", `${faction.name} emerges, trying to ${faction.goal}. Current move: ${faction.action}.`);
}

function chooseOpposition() {
  if (!state.factions.length || Math.random() > 0.5) {
    return rand(TABLES.oppositions);
  }
  return `agents of ${rand(state.factions).name}`;
}

function escalationTick() {
  state.world.dangerLevel = Math.min(5, state.world.dangerLevel + 1);
  state.world.factionPressure = Math.min(5, state.world.factionPressure + 1);
  state.world.doom += 1;
  if (!state.world.weather) {
    state.world.weather = rand(TABLES.weather);
  } else {
    const history = state.world.weather.split("; ");
    history.push(`worsening ${rand(TABLES.weather)}`);
    state.world.weather = history.slice(-MAX_WEATHER_HISTORY_LENGTH).join("; ");
  }
  renderWorld();
  logEntry(
    "escalation",
    `The world tightens: danger ${state.world.dangerLevel}, faction pressure ${state.world.factionPressure}, doom ${state.world.doom}.`
  );
}

function generateSituation() {
  captureWorld();
  const environment = `${rand(TABLES.environments)}${state.world.region ? ` in ${state.world.region}` : ""}`;
  const pressure = state.world.dangerLevel >= 4 ? `${rand(TABLES.pressures)} and panic spreads` : rand(TABLES.pressures);
  const opposition = state.world.activeThreat || chooseOpposition();
  const twist = rand(TABLES.twists);
  const choice = rand(TABLES.choices);
  const escalation = rand(TABLES.escalations);
  const discovery = rand(TABLES.discoveries);

  const text = [
    `Environment: ${environment}`,
    `Pressure: ${pressure}`,
    `Opposition: ${opposition}`,
    `Twist: ${twist}`,
    `Player Choice: ${choice}`,
    `Escalation: ${escalation}`,
    `Discovery: ${discovery}`
  ].join("\n");

  $("situationOutput").textContent = text;
  state.situationCount += 1;
  logEntry("situation", text);

  if (state.situationCount % 3 === 0) {
    escalationTick();
  }

  saveState();
}

function generateLocation() {
  const output = [
    `Room Type: ${rand(TABLES.roomTypes)}`,
    `Terrain: ${rand(TABLES.terrain)}`,
    `Exits: ${rand(TABLES.exits)}`,
    `Environmental Detail: ${rand(TABLES.details)}`,
    `Hazard: ${rand(TABLES.hazards)}`,
    `Sensory Cue: ${rand(TABLES.sensory)}`
  ].join("\n");

  $("locationOutput").textContent = output;
  logEntry("location", output);
}

function askOracle() {
  captureWorld();
  const question = $("oracleQuestion").value.trim();
  if (!question) {
    $("oracleOutput").textContent = "The oracle requires a question.";
    return;
  }

  const base = ["No, and…", "No", "No, but…", "Yes, but…", "Yes", "Yes, and…"];
  let index = Math.floor(Math.random() * base.length);

  if (state.world.dangerLevel >= 4 && index > 0) index -= 1;
  if (state.world.factionPressure <= 2 && index < 5) index += 1;

  const answer = `${base[index]} ${question.replace(/[.!?]+$/, "")}.`;
  $("oracleOutput").textContent = answer;
  logEntry("oracle", answer);
}

function bindEvents() {
  $("saveWorld").addEventListener("click", () => {
    captureWorld();
    logEntry("world", "World state updated.");
  });

  $("addMember").addEventListener("click", () => {
    if (state.party.length >= MAX_PARTY_SIZE) {
      logEntry("party", "Party is already at four members.");
      return;
    }
    state.party.push({ name: "", archetype: "", level: 1, hp: "", stress: "", notes: "", inventory: "" });
    renderParty();
    saveState();
    logEntry("party", "A new party slot has been opened.");
  });

  $("generateFaction").addEventListener("click", generateFaction);
  $("generateSituation").addEventListener("click", generateSituation);
  $("generateLocation").addEventListener("click", generateLocation);
  $("askOracle").addEventListener("click", askOracle);
}

function init() {
  renderWorld();
  renderParty();
  renderFactions();
  renderLog();
  bindEvents();
}

init();

/*
Future expansion hooks:
- procedural quests
- settlement generation
- hex travel
- NPC generators
- treasure tables
- relationship systems
- dungeon themes
- rumor generation
- campaign arcs
- relic generation
*/
