import { buildPrefixMap, normalizeTier } from "./utils.js";

/**
POST JSON:
{
  raw: "full OP raw text",
  parsed: { mode, teamHeaders, matches },
  options: {
    generateKey: true,
    useSprites: true,
    prefixOverrides: { "Team Name": "OVR" },
    provideReplayUrls: { "<encoded_key>": "https://..." } // optional mapping
  }
}
Response: { bbcode: "...", prefixes: {...}, detectedTiers: [...] }
*/

function placeholderUrlFor(match) {
  // safe placeholder that can be replaced later
  const key = encodeURIComponent(`${match.tier || "GEN"}__${match.p1}__vs__${match.p2}`);
  return `REPLAY_URL_PLACEHOLDER:${key}`;
}

function decorateName(name, sprite=false) {
  if (!sprite) return name;
  // simple inline decoration: put a small token on both sides (sample)
  const token = ":pokeball:";
  return `${token} ${name} ${token}`;
}

function formatTeamLink(url, leftPrefix, p1Name, p2Name, rightPrefix, isMonotype=false, types=null, useSprites=true) {
  const left = leftPrefix ? `[${leftPrefix}] ` : "";
  const right = rightPrefix ? ` [${rightPrefix}]` : "";
  const p1 = decorateName(`${left}${p1Name}`, useSprites);
  const p2 = decorateName(`${p2Name}${right}`, useSprites);
  let line = `[URL='${url}']${p1} vs ${p2}[/URL]`;
  if (isMonotype && types && types.t1 && types.t2) {
    line += ` (${types.t1} vs ${types.t2})`;
  }
  return line;
}

function formatIndividual(p1, p2, gameLinks=[], tier="", types=null, useSprites=false) {
  const isMono = /monotype/i.test(tier);
  let head = `${p1} vs ${p2}`;
  if (isMono && types && types.t1 && types.t2) head += ` (${types.t1} vs ${types.t2})`;
  const games = gameLinks.map((u,i)=>`[Game ${i+1}](${u})`).join(" ");
  return `${head}\n${games}`.trim();
}

export default function handler(req, res) {
  try {
    const body = req.body || {};
    const parsed = body.parsed;
    const raw = body.raw || "";
    if (!parsed) return res.status(400).json({ error: "Provide parsed object (from parse-thread) in body" });

    const options = body.options || {};
    const useSprites = options.useSprites !== false;
    const prefixOverrides = options.prefixOverrides || {};
    const replayUrlMap = options.provideReplayUrls || {}; // optional mapping: encoded_key->url

    // build prefix map from team headers
    const prefixMap = buildPrefixMap(parsed.teamHeaders || [], prefixOverrides);

    // detect tiers via simple scan (detect any mentioned in raw)
    const tiersRes = await (async ()=>{
      // simple logic: look for known tokens
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

    // Group matches by normalized tier
    const byTier = {};
    for (const m of parsed.matches || []) {
      const tierNorm = m.tier ? normalizeTier(m.tier) : (tiersRes[0] || "");
      const isMono = /monotype/i.test(tierNorm);

      // choose replay url: from provided map or placeholder
      const key = encodeURIComponent(`${tierNorm || "GEN"}__${m.p1}__vs__${m.p2}`);
      const url = replayUrlMap[key] || placeholderUrlFor(m);

      if (parsed.mode === 'premier') {
        // map player to team prefix if possible
        // prefixMap keys are team names, but we don't always have player->team mapping.
        // attempt best-effort: if teamHeaders included fullLeft/fullRight earlier, we used teamHeaders as names.
        // We'll attach prefix only when prefixMap contains player's team name exactly as provided in parsed.teamHeaders.
        // As fallback, we leave blank.
        // (You can override mapping by providing prefixOverrides or by pre-populating parsed.matches with teamPrefix fields.)
        const p1Prefix = prefixMap[m.p1] || null;
        const p2Prefix = prefixMap[m.p2] || null;
        const types = m.types || null;
        const line = formatTeamLink(url, p1Prefix, m.p1, m.p2, p2Prefix, isMono, types, useSprites);
        byTier[tierNorm] = byTier[tierNorm] || [];
        byTier[tierNorm].push(line);
      } else {
        // individuals
        const games = (m.gameLinks || []).map(g=>g.url).filter(Boolean);
        const line = formatIndividual(m.p1, m.p2, games.length ? games : [], tierNorm, m.types || null, false);
        byTier[tierNorm] = byTier[tierNorm] || [];
        byTier[tierNorm].push(line);
      }
    }

    // build BBCode: optional key first
    const sections = [];
    if (options.generateKey && parsed.teamHeaders && parsed.teamHeaders.length) {
      // generate key using prefixes
      sections.push("[B]Team Key[/B]");
      for (const t of parsed.teamHeaders) {
        const pref = prefixMap[t];
        const sprite = useSprites ? ":pokeball: " : "";
        sections.push(`${sprite}[B]${t}[/B] [${pref}]`);
      }
      sections.push("\n");
    }

    // append by-tier sections
    for (const tier of Object.keys(byTier)) {
      sections.push(tier || "Matches");
      for (const ln of byTier[tier]) sections.push(ln);
      sections.push("\n");
    }

    const bbcode = sections.join("\n");

    return res.status(200).json({ bbcode, prefixes: prefixMap, detectedTiers: tiersRes });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
