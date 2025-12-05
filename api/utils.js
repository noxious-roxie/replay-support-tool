// api/utils.js
export function initialsFromTeamName(teamName) {
  if (!teamName) return "TM";
  const words = teamName.replace(/[^\w\s]/g,' ').split(/\s+/).filter(Boolean);
  if (words.length === 1) {
    return (words[0].slice(0,3)).toUpperCase();
  }
  const pick = words.slice(0,3).map(w=>w[0]).join('').toUpperCase();
  return pick.slice(0,4);
}

export function buildPrefixMap(teamHeaders = [], overrides = {}) {
  const map = {}, used = new Set(Object.values(overrides||[]).map(x=>x.toUpperCase()));
  Object.assign(map, overrides);
  for (const name of teamHeaders) {
    if (map[name]) continue;
    let cand = initialsFromTeamName(name);
    let suffix = 1;
    while (used.has(cand)) {
      cand = (cand.slice(0,3) + String(suffix)).toUpperCase();
      suffix++;
    }
    map[name] = cand;
    used.add(cand);
  }
  return map;
}

/** normalize tier text to "GEN SHORT" e.g. "SV OU" or return original */
export function normalizeTier(t) {
  if (!t) return "";
  const s = t.toUpperCase();
  // quick normalization for gen names
  const gens = { 'GEN9':'SV','SV':'SV','GEN8':'SS','SS':'SS','GEN7':'SM','SM':'SM','ORAS':'ORAS','GEN6':'ORAS','BW':'BW','DPP':'DPP','ADV':'ADV','GSC':'GSC','RBY':'RBY' };
  // find gen token
  for (const k of Object.keys(gens)) {
    if (s.includes(k)) {
      // find tier token (OU/UU/etc)
      const tierMatch = s.match(/\b(OU|UU|RU|NU|PU|ZU|LC|UBERS|DOUBLES|2V2|ANYTHING GOES|AG|MONOTYPE|RAND)\b/i);
      const tier = tierMatch ? tierMatch[0].replace(/\s+/,' ') : "";
      return `${gens[k]} ${tier}`.trim();
    }
  }
  // fallback: if contains monotype
  if (s.includes('MONOTYPE')) return `Monotype`;
  // fallback: return original maybe already "RBY OU"
  return t.trim();
}
