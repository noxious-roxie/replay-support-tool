// ===========================
// DOM ELEMENTS
// ===========================
const threadInput = document.getElementById("threadInput");
const btnParse = document.getElementById("btnParse");
const btnGenerateReplays = document.getElementById("btnGenerateReplays");
const btnGenerateKey = document.getElementById("btnGenerateKey");

const parsedArea = document.getElementById("parsedArea");
const parsedJson = document.getElementById("parsedJson");

const outputArea = document.getElementById("outputArea");
const bbOutput = document.getElementById("bbOutput");

const keyArea = document.getElementById("keyArea");
const keyOutput = document.getElementById("keyOutput");

// stored parsed result
let parsedData = null;


// ===========================
// PARSE THREAD BUTTON
// ===========================
btnParse.addEventListener("click", async () => {
  const input = threadInput.value.trim();
  if (!input) {
    alert("Please enter a Smogon thread URL or OP text.");
    return;
  }

  // If user pasted a URL -> call backend fetch
  const isUrl = input.startsWith("http://") || input.startsWith("https://");

  parsedJson.textContent = "Parsing...";
  parsedArea.classList.remove("hidden");

  try {
    let responseData;

    if (isUrl) {
      // Call Vercel backend
      const res = await fetch("/api/fetchSmogon?url=" + encodeURIComponent(input));
      if (!res.ok) throw new Error("Failed to fetch Smogon thread.");
      responseData = await res.json();
    } else {
      // Raw pasted text fallback
      responseData = { ok: true, raw: input };
    }

    parsedData = responseData;

    // Show JSON preview (just for debugging)
    parsedJson.textContent = JSON.stringify(responseData, null, 2);

    // Enable next buttons
    btnGenerateReplays.disabled = false;
    btnGenerateKey.disabled = false;

    alert("Thread parsed successfully!");

  } catch (err) {
    parsedJson.textContent = "❌ ERROR: " + err.message;
    btnGenerateReplays.disabled = true;
    btnGenerateKey.disabled = true;
  }
});


// ===========================
// REPLAY GENERATION PLACEHOLDER
// (real logic goes later)
// ===========================
btnGenerateReplays.addEventListener("click", () => {
  if (!parsedData) return alert("Parse a thread first.");

  outputArea.classList.remove("hidden");
  bbOutput.value =
    "[b]Replay formatting will appear here.[/b]\n\n" +
    "Parsed keys available:\n" +
    Object.keys(parsedData).join(", ");
});


// ===========================
// KEY GENERATION PLACEHOLDER
// (real logic goes later)
// ===========================
btnGenerateKey.addEventListener("click", () => {
  if (!parsedData) return alert("Parse a thread first.");

  keyArea.classList.remove("hidden");
  keyOutput.value =
    "[b]KEY will appear here.[/b]\n\n" +
    "Parsed keys available:\n" +
    Object.keys(parsedData).join(", ");
});

