import axios from "axios";
import cheerio from "cheerio";

/**
 * Lightweight OP parser that extracts:
 * - raw text of first .message-body
 * - parsed.mode -> "premier" or "individual"
 * - teamHeaders array (team title strings)
 * - matches array [{ tier, p1, p2, raw }]
 *
 * Heuristic-based for common Smogon OP layouts like the examples you gave.
 */

function parseOpText(rawText) {
  const lines = rawText.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
  const teamHeaders = [];
  const matches = [];
  let mode = "individual";

  for (const line of lines) {
    // team header like ":tangela: Team A (4) vs (6) Team B :emoji:"
    if (/vs/.test(line) && /[A-Za-z]/.test(line) && /\(/.test(line)) {
      // extract left/right team names roughly
      const parts = line.split(/\s+vs\s+/i);
      if (parts.length === 2) {
        const left = parts[0].replace(/[:\[\]]/g,'').replace(/\(\d+\)/,'').trim();
        const right = parts[1].replace(/[:\[\]]/g,'').replace(/\(\d+\)/,'').trim();
        teamHeaders.push(left);
        teamHeaders.push(right);
        mode = "premier";
        continue;
      }
    }

    // match lines: "RBY OU Bo5: PlayerA vs PlayerB"
    const m = line.match(/^([A-Za-z0-9\-\s]+?):\s*(.+?)\s+vs\s+(.+)$/i);
    if (m) {
      const tier = m[1].trim();
      matches.push({ tier, p1: m[2].trim(), p2: m[3].trim(), raw: line });
      mode = "premier";
      continue;
    }

    // individual match lines "PlayerA vs PlayerB" (no tier)
    const mi = line.match(/^(.+?)\s+vs\s+(.+)$/i);
    if (mi && !/RBY|SV|SS|MONOTYPE|BO\d/i.test(line)) {
      matches.push({ tier: null, p1: mi[1].trim(), p2: mi[2].trim(), raw: line });
      if (mode !== "premier") mode = "individual";
      continue;
    }

    // fallback: detect simple tier header like "RBY OU"
    if (/^(sv|ss|sm|oras|bw|dpp|adv|gsc|rby)\b/i.test(line) && /\b(ou|uu|ru|nu|pu|lc|ubers|doubles|2v2|anything goes|monotype)\b/i.test(line)) {
      matches.push({ tier: line.trim(), p1: null, p2: null, raw: line, isHeader: true });
      continue;
    }
  }

  return { mode, teamHeaders: [...new Set(teamHeaders)], matches };
}

export default async function handler(req, res) {
  try {
    const url = req.query.url || req.body?.url;
    if (!url) return res.status(400).json({ error: "Missing ?url=" });

    const { data } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const $ = cheerio.load(data);

    // try two selectors: .message-body or article .message-body
    let opElem = $('.message-body').first();
    if (!opElem || !opElem.length) opElem = $('article.message-body').first();

    const raw = opElem && opElem.length ? opElem.text().replace(/\r\n/g,'\n') : $('body').text();
    const parsed = parseOpText(raw || '');
    return res.status(200).json({ raw, parsed });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
