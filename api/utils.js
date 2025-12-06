// api/utils.js
export function initialsFromTeamName(teamName) {
  if (!teamName) return "TM";
  const words = teamName.replace(/[^\w\s]/g,' ').split(/\s+/).filter(Boolean);
  if (words.length === 1) return (words[0].slice(0,3)).toUpperCase();
  const prefix = words.slice(0,3).map(w=>w[0]).join('').toUpperCase();
  return prefix.slice(0,4);
}

export function buildPrefixMap(teamNames = [], overrides = {}) {
  const map = {}, used = new Set(Object.values(overrides||{}).map(x=>x.toUpperCase()));
  Object.assign(map, overrides || {});
  for (const t of teamNames) {
    if (map[t]) continue;
    let cand = initialsFromTeamName(t);
    let i = 1;
    while (used.has(cand)) {
      cand = (cand.slice(0,3) + String(i)).toUpperCase();
      i++;
    }
    map[t] = cand;
    used.add(cand);
  }
  return map;
}

export function normalizeTier(t) {
  if (!t) return "";
  const s = t.toUpperCase();
  const gens = { 'SV':'SV','SS':'SS','SM':'SM','ORAS':'ORAS','BW':'BW','DPP':'DPP','ADV':'ADV','GSC':'GSC','RBY':'RBY' };
  for (const k of Object.keys(gens)) {
    if (s.includes(k)) {
      const tierMatch = s.match(/\b(OU|UU|RU|NU|PU|ZU|LC|UBERS|DOUBLES|2V2|ANYTHING GOES|AG|MONOTYPE|RAND)\b/i);
      const tier = tierMatch ? tierMatch[0] : "";
      return `${gens[k]} ${tier}`.trim();
    }
  }
  if (s.includes('MONOTYPE')) return 'Monotype';
  return t.trim();
}

