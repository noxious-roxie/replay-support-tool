import { normalizeTier } from "./utils.js";

export default function handler(req, res) {
  try {
    const text = (req.body?.text || "").toString().toLowerCase();
    const gens = ["SV","SS","SM","ORAS","BW","DPP","ADV","GSC","RBY"];
    const base = [
      { short:"OU", names:["ou","overused"] },
      { short:"UU", names:["uu","underused"] },
      { short:"RU", names:["ru","rarelyused"] },
      { short:"NU", names:["nu","neverused"] },
      { short:"PU", names:["pu"] },
      { short:"ZU", names:["zu","zeroused"] },
      { short:"LC", names:["lc","little cup","littlecup"] },
      { short:"Doubles", names:["doubles"] },
      { short:"2v2", names:["2v2"] },
      { short:"Ubers", names:["ubers"] },
      { short:"Anything Goes", names:["anything goes","ag"] },
      { short:"Monotype", names:["monotype"] }
    ];

    const found = new Set();
    for (const g of gens) {
      for (const b of base) {
        for (const n of b.names) {
          const patterns = [
            `${g.toLowerCase()} ${n}`,
            `${g.toLowerCase()}-${n}`,
            `${n} ${g.toLowerCase()}`,
            `${n}`
          ];
          if (patterns.some(p => text.includes(p))) {
            found.add(`${g} ${b.short}`);
            break;
          }
        }
      }
    }
    return res.status(200).json({ tiers: Array.from(found) });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
