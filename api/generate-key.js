import { buildPrefixMap } from "./utils.js";

/**
 * POST JSON:
 * {
 *  parsed: { teamHeaders: [...] },
 *  options: { useSprites: true, prefixOverrides: { "Team Name": "OVR" } }
 * }
 */
const SAMPLE_SPRITES = [":bulbasaur:", ":charmander:", ":squirtle:", ":pikachu:", ":garchomp:"];

function pickSprite(i){
  return SAMPLE_SPRITES[i % SAMPLE_SPRITES.length];
}

export default function handler(req, res) {
  try {
    const parsed = req.body?.parsed;
    if (!parsed) return res.status(400).json({ error: "Provide parsed in body" });
    const teams = parsed.teamHeaders || [];
    const opts = req.body.options || {};
    const overrides = opts.prefixOverrides || {};
    const prefixMap = buildPrefixMap(teams, overrides);

    // create key lines: [sprite] Team Name [PREFIX]
    const lines = [];
    let i=0;
    for (const t of teams) {
      const prefix = prefixMap[t] || initialsFromTeamName(t);
      const sprite = opts.useSprites ? pickSprite(i) + " " : "";
      lines.push(`${sprite}[B]${t}[/B] [${prefix}]`);
      i++;
    }

    // Also return the mapping object
    res.status(200).json({ keyBBCode: lines.join("\n"), prefixes: prefixMap });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
