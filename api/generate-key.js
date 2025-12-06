// api/generate-key.js
import { buildPrefixMap, initialsFromTeamName } from "./utils.js";

const SAMPLE_SPRITES = [":bulbasaur:", ":charizard:", ":pikachu:", ":garchomp:", ":tinglu:", ":chienpao:"];

function pickSprite(i) { return SAMPLE_SPRITES[i % SAMPLE_SPRITES.length]; }

export default function handler(req, res) {
  try {
    const parsed = req.body?.parsed;
    if (!parsed) return res.status(400).json({ error: "Provide parsed object from /api/parse-thread" });
    const opts = req.body?.options || {};
    const overrides = opts.prefixOverrides || {};
    const teams = parsed.teamHeaders || [];
    const prefixMap = buildPrefixMap(teams, overrides);

    // Option 2 format: [PREFIX] sprite
    const lines = [];
    teams.forEach((t, i) => {
      const pref = prefixMap[t] || initialsFromTeamName(t);
      const sprite = opts.useSprites ? (pickSprite(i) + " ") : "";
      // Classic: prefix first as requested
      lines.push(`[B][${pref}][/B] ${sprite}[B]${t}[/B]`);
    });

    return res.status(200).json({ keyBBCode: lines.join("\n"), prefixes: prefixMap });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
