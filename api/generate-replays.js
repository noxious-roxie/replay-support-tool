// api/generate-replays.js
import { buildPrefixMap, normalizeTier } from "./utils.js";

/**
POST:
{
  raw: "...",
  parsed: { mode, teamHeaders, matches },
  options: {
    useSprites: true,
    autoPrefixes: true,
    prefixOverrides: { "Team Name": "OVR" },
    overrideReplayLinks: { "encoded_key": "https://..." }
  }
}
*/

function placeholderUrlFor(match) {
  const key = encodeURIComponent(`${match.tier || "GEN"}__${match.p1}__vs__${match.p2}`);
  return `REPLAY_URL_PLACEHOLDER:${key}`;
}

function decorateName(name, useSprites=false) {
  if (!useSprites) return name;
  // simple small token around name; the front-end also gives sample sprites
  return `:pokeball: ${name} :pokeball:`;
}

export default function handler(req, res) {
  try {
    const body = req.body || {};
    const parsed = body.parsed || {};
    const raw = body.raw || "";
    const options = body.options || {};
    const useSprites = options.useSprites !== false;
    const prefixOverrides = options.prefixOverrides || {};
    const overrideReplayLinks = options.overrideReplayLinks || {};

    // Build prefixes from team headers
    const prefixMap = buildPrefixMap(parsed.teamHeaders || [], prefixOverrides);

    // naive tier detection (also returns list)
    const tiersRes = (() => {
      const txt = (raw || "").toLowerCase();
      const gens = ["sv","ss","sm","oras","bw","dpp","adv","gsc","rby"];
      const base = ["ou","uu","ru","nu","pu","zu","lc","doubles","2v2","ubers","anything goes","monotype"];
      const found = new Set();
      for (const g of gens) {
        for (const b of base) {
          if (txt.includes(`${g} ${b}`) || txt.includes(`${g}-${b}`) || txt.includes(`${b} ${g}`)) {
            found.add(`${g.toUpperCase()} ${b.toUpperCase()}`);
          }
        }
      }
      return Array.from(found);
    })();

    // group matches by tier
    const byTier = {};
    const matches = parsed.matches || [];

    for (const m of matches) {
      const tierNorm = m.tier ? normalizeTier(m.tier) : (tiersRes[0] || "");
      const isMono = /monotype/i.test(tierNorm);
      const key = encodeURIComponent(`${tierNorm || "GEN"}__${m.p1}__vs__${m.p2}`);
      const provided = overrideReplayLinks[key] || overrideReplayLinks[decodeURIComponent(key)];
      const url = provided || (m.replayUrl || placeholderUrlFor(m));

      if (!byTier[tierNorm]) byTier[tierNorm] = [];

      if (parsed.mode === "premier") {
        const p1Prefix = prefixMap[m.p1] || null;
        const p2Prefix = prefixMap[m.p2] || null;

        const p1Name = decorateName(`${p1Prefix ? `[${p1Prefix}] ` : ""}${m.p1}`, useSprites);
        const p2Name = decorateName(`${m.p2}${p2Prefix ? ` [${p2Prefix}]` : ""}`, useSprites);

        let line = `[URL='${url}']${p1Name} vs ${p2Name}[/URL]`;

        if (isMono && m.types && m.types.t1 && m.types.t2) {
          line += ` (${m.types.t1} vs ${m.types.t2})`;
        }

        byTier[tierNorm].push(line);
      } else {
        // individuals
        const games = (m.gameLinks || []).map((g, i) => `[Game ${i+1}](${g.url || g})`).join(' ');
        let header = `${m.p1} vs ${m.p2}`;
        if (isMono && m.types && m.types.t1 && m.types.t2) header += ` (${m.types.t1} vs ${m.types.t2})`;
        const line = games ? `${header}\n${games}` : `${header}\n[Game 1](${url})`;
        byTier[tierNorm].push(line);
      }
    }

    // Build final BBCode
    const sections = [];

    // Optional Key (if requested)
    if (options.generateKey && parsed.teamHeaders && parsed.teamHeaders.length) {
      sections.push("[B]Team Key[/B]");
      for (const t of parsed.teamHeaders) {
        const pref = prefixMap[t] || t.slice(0,3).toUpperCase();
        const sprite = useSprites ? ":pokeball:" : "";
        // Option 2 format: prefix first
        sections.push(`[B][${pref}][/B] ${sprite} [B]${t}[/B]`);
      }
      sections.push("\n");
    }

    // Append tier sections
    for (const tier of Object.keys(byTier)) {
      if (!tier) continue;
      sections.push(`[B][SIZE=5]${tier}[/SIZE][/B]`);
      for (const ln of byTier[tier]) sections.push(ln);
      sections.push("\n");
    }

    const bbcode = sections.join("\n");
    return res.status(200).json({ bbcode, prefixes: prefixMap, detectedTiers: tiersRes });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
