/* ---------------------------------------------------------
   FRONTEND SCRIPT — tournament tool
   Handles:
   - Fetching thread data from /api/parse-thread
   - Generating BBCode for Team Tours
   - Generating BBCode for Individuals
   - Generating Key (team → acronym → sprite)
   - Tier detection logic
   - Manual replay overrides
---------------------------------------------------------- */

// =========================================================
// OPTIONAL: MANUAL REPLAY URL OVERRIDES
// =========================================================
//
// HOW TO USE:
// overrideReplayLinks["Player A vs Player B"] = [
//   "https://replay.pokemonshowdown.com/...",
//   "https://replay.pokemonshowdown.com/..."
// ];
//
// If empty → tool uses automatically-detected replay URLs.
// If you add entries → they override detections for that MU.

const overrideReplayLinks = {
    // "cpt.kraken vs Fusien": [
    //   "https://replay.pokemonshowdown.com/smogtours-gen9monotype-890401"
    // ]
};

// =========================================================
// ELEMENTS
// =========================================================

const inputThreadURL = document.getElementById("threadUrl");
const btnGenerateReplays = document.getElementById("generateReplays");
const btnGenerateKey = document.getElementById("generateKey");
const outputBox = document.getElementById("output");
const modeSelect = document.getElementById("modeSelect");

// =========================================================
// HELPER — sanitize
// =========================================================

function clean(str) {
    return str.replace(/\s+/g, " ").trim();
}

// =========================================================
// HELPER — fetch API
// =========================================================

async function fetchAPI(endpoint, payload) {
    const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    return await res.json();
}

// =========================================================
// MAIN: GENERATE REPLAYS
// =========================================================

btnGenerateReplays.onclick = async () => {
    outputBox.value = "Loading…";

    const url = clean(inputThreadURL.value);
    if (!url) return (outputBox.value = "Please enter a thread URL.");

    const parsed = await fetchAPI("/api/parse-thread", { threadURL: url });
    if (!parsed.success) {
        outputBox.value = "Thread parsing failed.";
        return;
    }

    const { matchups, teams, tiers } = parsed;

    let result = "";

    if (modeSelect.value === "team") {
        result += generateTeamReplays(matchups, tiers);
    } else {
        result += generateIndividuals(matchups, tiers);
    }

    outputBox.value = result;
};

// =========================================================
// TEAM TOURNAMENT REPLAY GENERATOR (BBCode)
// =========================================================

function generateTeamReplays(matchups, tiers) {
    let output = "";

    Object.keys(tiers).forEach(tierName => {
        output += `\n[B][SIZE=5]${tierName}[/SIZE][/B]\n`;

        tiers[tierName].forEach(mu => {
            const key = `${mu.p1} vs ${mu.p2}`;

            const replayLinks = overrideReplayLinks[key] || mu.replays || [];

            let line = `[URL='${replayLinks[0] || "#"}'][${mu.team1}] ${mu.p1} vs ${mu.p2} [${mu.team2}][/URL]`;

            if (mu.type1 && mu.type2 && tierName.toLowerCase().includes("monotype")) {
                line += ` (${mu.type1} vs ${mu.type2})`;
            }

            output += line + "\n";
        });
    });

    return output;
}

// =========================================================
// INDIVIDUALS REPLAY GENERATOR
// No sprites, no team tags
// =========================================================

function generateIndividuals(matchups, tiers) {
    let output = "";

    Object.keys(tiers).forEach(tierName => {
        output += `\n[B][SIZE=5]${tierName}[/SIZE][/B]\n`;

        tiers[tierName].forEach(mu => {
            const key = `${mu.p1} vs ${mu.p2}`;
            const replays = overrideReplayLinks[key] || mu.replays || [];

            let games = "";
            replays.forEach((url, i) => {
                games += `[URL='${url}'][Game ${i + 1}][/URL] `;
            });

            output += `${mu.p1} vs ${mu.p2} — ${tierName} ${games}\n`;
        });
    });

    return output;
}

// =========================================================
// TEAM KEY GENERATOR
// =========================================================

btnGenerateKey.onclick = async () => {
    outputBox.value = "Loading…";

    const url = clean(inputThreadURL.value);
    if (!url) return (outputBox.value = "Please enter a thread URL.");

    const parsed = await fetchAPI("/api/parse-thread", { threadURL: url });
    if (!parsed.success) {
        outputBox.value = "Failed to parse teams.";
        return;
    }

    const { teams } = parsed;

    let keyText = `[B][SIZE=5]Team Key[/SIZE][/B]\n`;

    teams.forEach(team => {
        keyText += `${team.sprite} ${team.name} [${team.acronym}]\n`;
    });

    outputBox.value = keyText;
};
