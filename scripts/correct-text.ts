/**
 * correct-text.ts — Correct selected text using a local Ollama model.
 *
 * Workflow:
 *   1. Capture the currently focused window (must run via keyboard shortcut, not Ulauncher)
 *   2. Read the primary selection (highlighted text — no Ctrl+C needed)
 *   3. Send to Ollama for minimal spelling/grammar correction
 *   4. Write corrected text to clipboard
 *   5. Focus back to original window and paste
 *
 * Requirements:
 *   sudo apt install xdotool xclip
 *   curl -fsSL https://ollama.com/install.sh | sh
 *   ollama pull mistral
 *
 * Bind to a keyboard shortcut (Settings → Keyboard → Custom Shortcuts):
 *   Command: /home/YOU/.bun/bin/bun run /home/YOU/repos/ScriptKitten/scripts/correct-text.ts
 *
 * Override model: SK_MODEL=llama3.2:3b bun run scripts/correct-text.ts
 */

const OLLAMA_URL = "http://localhost:11434/api/generate";
const MODEL = process.env.SK_MODEL ?? "mistral";

const PROMPT = (text: string) =>
  `Correct only the spelling and grammar mistakes in the text below.
Do NOT rephrase, reword, or restructure anything.
Do NOT add or remove words unless strictly necessary to fix a clear error.
Return ONLY the corrected text — no explanations, no quotes, no formatting.

Text:
${text}`;

// ── helpers ──────────────────────────────────────────────────────────────────

function notify(title: string, body: string) {
  Bun.spawnSync(["notify-send", "--app-name=ScriptKitten", title, body]);
}

function die(msg: string): never {
  notify("SK: Correct Text — Error", msg);
  console.error(msg);
  process.exit(1);
}

// Capture the focused window ID right now, before anything steals focus
function getActiveWindow(): string {
  const { stdout, exitCode } = Bun.spawnSync(["xdotool", "getactivewindow"]);
  if (exitCode !== 0) return "";
  return stdout.toString("utf8").trim();
}

// Read the primary selection (= whatever is currently highlighted, no Ctrl+C required)
function readPrimarySelection(): string {
  const { stdout, exitCode } = Bun.spawnSync([
    "xclip", "-selection", "primary", "-o",
  ]);
  if (exitCode !== 0) return "";
  return stdout.toString("utf8");
}

// Read clipboard
function readClipboard(): string {
  const { stdout, exitCode } = Bun.spawnSync([
    "xclip", "-selection", "clipboard", "-o",
  ]);
  if (exitCode !== 0) return "";
  return stdout.toString("utf8");
}

// Write text to clipboard
function writeClipboard(text: string) {
  const { exitCode } = Bun.spawnSync(["xclip", "-selection", "clipboard"], {
    stdin: new TextEncoder().encode(text),
  });
  if (exitCode !== 0) die("Could not write to clipboard.");
}

// ── main ─────────────────────────────────────────────────────────────────────

// 1. Grab window + selection immediately — before any focus change
const sourceWindow   = getActiveWindow();
const selected       = readPrimarySelection();
const prevClipboard  = readClipboard();

if (!selected.trim()) {
  die("No text selected. Highlight some text, then trigger the shortcut.");
}

// 2. Working notification
notify("SK: Correct Text", `Correcting ${selected.trim().split(/\s+/).length} words…`);

// 3. Call Ollama
let corrected: string;
try {
  const res = await fetch(OLLAMA_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, prompt: PROMPT(selected), stream: false }),
  });

  if (!res.ok) die(`Ollama error ${res.status}: ${await res.text()}`);

  const json = await res.json() as { response: string; error?: string };
  if (json.error) die(`Ollama: ${json.error}`);

  corrected = json.response.trim();
} catch (e: any) {
  if (e?.cause?.code === "ECONNREFUSED") {
    die("Ollama is not running.\nStart it with: ollama serve");
  }
  die(`Ollama unreachable: ${e?.message ?? e}`);
}

if (!corrected) die("Ollama returned an empty response.");

// 4. Write corrected text to clipboard
writeClipboard(corrected);

// 5. Focus back to the original window and paste
const hasYdotool = Bun.spawnSync(["which", "ydotool"]).exitCode === 0;

if (hasYdotool) {
  // Wayland: ydotool sends real kernel input events
  // Install: sudo apt install ydotool && sudo systemctl enable --now ydotoold
  Bun.spawnSync(["ydotool", "key", "ctrl+v"]);
} else if (sourceWindow) {
  // X11 / XWayland: refocus and send Ctrl+V
  Bun.spawnSync(["xdotool", "windowfocus", "--sync", sourceWindow]);
  await Bun.sleep(80);
  const { exitCode } = Bun.spawnSync([
    "xdotool", "key", "--window", sourceWindow, "--clearmodifiers", "ctrl+v",
  ]);

  if (exitCode !== 0) {
    // Last resort: type the corrected text character by character
    const { exitCode: typeCode } = Bun.spawnSync([
      "xdotool", "type", "--clearmodifiers", "--delay", "0", corrected,
    ]);
    if (typeCode !== 0) {
      notify("SK: Correct Text", "Corrected text is in your clipboard — press Ctrl+V to paste.\nFor native Wayland support: sudo apt install ydotool");
    }
  }
} else {
  notify("SK: Correct Text", "Corrected text is in your clipboard — press Ctrl+V to paste.");
}

// 6. Restore clipboard after paste has landed
await Bun.sleep(500);
if (prevClipboard) writeClipboard(prevClipboard);

// 7. Done
const before  = selected.trim().split(/\s+/);
const after   = corrected.trim().split(/\s+/);
const changed = before.filter((w, i) => w !== after[i]).length;

notify(
  "SK: Correct Text — Done",
  changed === 0
    ? "No corrections needed."
    : `${changed} word${changed > 1 ? "s" : ""} corrected.`,
);
