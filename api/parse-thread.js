// api/parse-thread.js
import axios from "axios";
import cheerio from "cheerio";

/**
 * POST { input }
 * returns { parsed: { mode, teamHeaders, matches }, raw }
 */

function parseOpText(rawText) {
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const teamHeaders = [];
  const matches = [];
  let mode = "individual";

  for (const line of lines) {
    // team header like ":tangela: Team A (4) vs (6) Team B :emoji:"
    if (/vs/.test(line) && /\(\d+\)/.test(line)) {
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

    // individuals: "PlayerA vs PlayerB" no tier
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
    const input = req.body?.input;
    if (!input) return res.status(400).json({ error: "Missing input" });

    let raw = input;
    // if URL, fetch thread and extract first .message-body
    if (/^https?:\/\//i.test(input)) {
      const { data } = await axios.get(input, { headers: { "User-Agent": "Mozilla/5.0" } });
      const $ = cheerio.load(data);
      const opElem = $(".message-body").first();
      raw = opElem && opElem.length ? opElem.text().replace(/\r\n/g, "\n") : $("body").text();
    }

    const parsed = parseOpText(raw || "");
    return res.status(200).json({ raw, parsed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

