/**
 * clipboard-clean.ts — Strip formatting/trailing whitespace from clipboard text.
 * Usage: bun run scripts/clipboard-clean.ts
 */

const { stdout: raw, exitCode } = Bun.spawnSync(["xclip", "-selection", "clipboard", "-o"]);

if (exitCode !== 0) {
  await Bun.spawn(["notify-send", "ScriptKitten", "Clipboard is empty or unreadable."]).exited;
  process.exit(1);
}

const cleaned = raw
  .toString("utf8")
  .replace(/\r\n/g, "\n")       // CRLF → LF
  .replace(/[ \t]+$/gm, "")     // trailing spaces per line
  .trim();

const clip = Bun.spawn(["xclip", "-selection", "clipboard"], {
  stdin: new Response(cleaned).body,
});
await clip.exited;

await Bun.spawn(["notify-send", "ScriptKitten", "Clipboard cleaned!"]).exited;
