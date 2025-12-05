// UI logic: calls parse-thread then generate-replays endpoints
async function qsel(id){ return document.getElementById(id); }
const btnParse = qsel('btnParse'), btnGen = qsel('btnGenerate'), copyBtn = qsel('copyBtn');

btnParse.addEventListener('click', async () => {
  const url = qsel('threadUrl').value.trim();
  if (!url) return alert('Paste a Smogon thread URL');
  btnParse.disabled = true;
  try {
    const res = await fetch(`/api/parse-thread?url=${encodeURIComponent(url)}`);
    const json = await res.json();
    qsel('parsedArea').classList.remove('hidden');
    qsel('rawText').textContent = json.raw || '';
    qsel('parsedJson').textContent = JSON.stringify(json.parsed, null, 2);
    btnGen.disabled = false;
  } catch (e) {
    alert('Parse failed: ' + e.message);
  } finally { btnParse.disabled = false; }
});

btnGen.addEventListener('click', async () => {
  btnGen.disabled = true;
  try {
    const raw = qsel('rawText').textContent;
    const parsed = JSON.parse(qsel('parsedJson').textContent);
    const options = {
      generateKey: qsel('optKey').checked,
      useSprites: qsel('optSprites').checked,
      autoPrefixes: qsel('optAutoPrefixes').checked
    };
    const res = await fetch('/api/generate-replays', {
      method: 'POST',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({ raw, parsed, options })
    });
    const json = await res.json();
    if (json.error) return alert(json.error);
    qsel('outputArea').classList.remove('hidden');
    qsel('bbcode').value = json.bbcode;
  } catch (e) {
    alert('Generate failed: ' + e.message);
  } finally { btnGen.disabled = false; }
});

copyBtn.addEventListener('click', async () => {
  const txt = qsel('bbcode').value;
  await navigator.clipboard.writeText(txt);
  copyBtn.textContent = 'Copied!';
  setTimeout(()=>copyBtn.textContent='Copy BBCode',1200);
});
