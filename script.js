async function fetchThread(url) {
  const encoded = encodeURIComponent(url);
  const res = await fetch(`/api/fetchSmogon?url=${encoded}`);
  const data = await res.json();
  if (!data.html) throw new Error("No HTML returned");
  return data.html;
}
document.getElementById("loadBtn").onclick = async () => {
  const url = document.getElementById("threadURL").value.trim();
  if (!url) {
    alert("Please enter a Smogon thread URL first.");
    return;
  }

  try {
    const html = await fetchThread(url);  // This calls your backend
    console.log("Fetched thread HTML:", html.substring(0, 200));

    // Use your parsing logic (temporarily just show raw HTML)
    document.getElementById("preview").value = html;

  } catch (err) {
    console.error(err);
    alert("Failed to fetch URL. Check console for details.");
  }
};

/* Frontend script for Tournament Formatter */

// --------------------
// OPTIONAL: Manual replay URL overrides
// Key is exactly "PlayerA vs PlayerB" as parsed (case-sensitive)
// Example:
// overrideReplayLinks["cpt.kraken vs Fusien"] = [
//   "https://replay.pokemonshowdown.com/smogtours-gen9monotype-890401",
//   "https://replay.pokemonshowdown.com/..."
// ];
const overrideReplayLinks = {}; // <- add overrides here

// --------------------
// Helpers: DOM
const $ = id => document.getElementById(id);
const btnParse = $('btnParse');
const btnGenerateReplays = $('btnGenerateReplays');
const btnGenerateKey = $('btnGenerateKey');

const threadInput = $('threadInput');
const parsedJson = $('parsedJson');
const parsedArea = $('parsedArea');
const outputArea = $('outputArea');
const keyArea = $('keyArea');
const bbOutput = $('bbOutput');
const keyOutput = $('keyOutput');

const copyReplays = $('copyReplays');
const copyKey = $('copyKey');

const optSprites = $('optSprites');
const optAutoPrefixes = $('optAutoPrefixes');
const optKey = $('optKey');

// --------------------
// Wire buttons
document.getElementById('btnParse').addEventListener('click', async () => {
  const text = threadInput.value.trim();
  if (!text) return alert('Paste a thread URL or OP text first.');
  // POST to parse-thread
  try {
    const res = await fetch('/api/parse-thread', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ input: text })
    });
    const j = await res.json();
    if (j.error) return alert('Parse error: ' + j.error);
    parsedJson.textContent = JSON.stringify(j.parsed, null, 2);
    parsedArea.classList.remove('hidden');
    btnGenerateReplays.disabled = false;
    btnGenerateKey.disabled = false;
  } catch (e) {
    alert('Parse failed: ' + e.message);
  }
});

// Generate Replays formatting
document.getElementById('btnGenerateReplays').addEventListener('click', async () => {
  const raw = threadInput.value.trim();
  if (!raw) return alert('Paste thread or OP first.');

  const parsedText = parsedJson.textContent ? JSON.parse(parsedJson.textContent) : null;

  const payload = {
    raw,
    parsed: parsedText,
    options: {
      useSprites: optSprites.checked,
      autoPrefixes: optAutoPrefixes.checked,
      generateKey: optKey.checked,
      overrideReplayLinks // send overrides to backend
    }
  };

  try {
    const res = await fetch('/api/generate-replays', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    const j = await res.json();
    if (j.error) return alert('Generate error: ' + j.error);
    bbOutput.value = j.bbcode || '';
    outputArea.classList.remove('hidden');
  } catch (e) {
    alert('Generate failed: ' + e.message);
  }
});

// Generate KEY only
document.getElementById('btnGenerateKey').addEventListener('click', async () => {
  const raw = threadInput.value.trim();
  if (!raw) return alert('Paste thread or OP first.');

  const parsedText = parsedJson.textContent ? JSON.parse(parsedJson.textContent) : null;
  const payload = { parsed: parsedText, options: { useSprites: optSprites.checked, prefixOverrides: {} } };

  try {
    const res = await fetch('/api/generate-key', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    const j = await res.json();
    if (j.error) return alert('Key error: ' + j.error);
    keyOutput.value = j.keyBBCode || '';
    keyArea.classList.remove('hidden');
  } catch (e) {
    alert('Generate KEY failed: ' + e.message);
  }
});

// Copy buttons
copyReplays?.addEventListener('click', async () => {
  await navigator.clipboard.writeText(bbOutput.value || '');
  copyReplays.textContent = 'Copied!';
  setTimeout(()=>copyReplays.textContent='Copy Replays BBCode',1200);
});
copyKey?.addEventListener('click', async () => {
  await navigator.clipboard.writeText(keyOutput.value || '');
  copyKey.textContent = 'Copied!';
  setTimeout(()=>copyKey.textContent='Copy KEY',1200);
});
