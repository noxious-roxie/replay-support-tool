document.getElementById("parse").addEventListener("click", async () => {
  const url = document.getElementById("thread").value;

  const res = await fetch("/api/parse-thread", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ threadUrl: url })
  });

  const data = await res.json();

  alert("Thread parsed successfully.");
});


document.getElementById("generate").addEventListener("click", async () => {
  const res = await fetch("/api/generate-replays", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      threadUrl: document.getElementById("thread").value,
      generateKey: document.getElementById("key").checked,
      decorateSprites: document.getElementById("sprites").checked,
      autoPrefixes: document.getElementById("prefixes").checked
    })
  });

  const data = await res.json();

  // SHOW THE OUTPUT
  document.getElementById("output-container").style.display = "block";
  document.getElementById("output").value = data.bbcode || "No BBCode generated.";
});
