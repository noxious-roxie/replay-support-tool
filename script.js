async function generate() {
  const text = document.getElementById("input").value;

  const res = await fetch("/api/generate-bbcode", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text })
  });

  const data = await res.json();
  document.getElementById("output").textContent = data.result || "Error.";
}
