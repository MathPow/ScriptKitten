/**
 * generate-password.ts — Generate a random password and copy it to clipboard.
 * Usage: bun run scripts/generate-password.ts [length]
 */
import { randomBytes } from "crypto";

const length = parseInt(process.argv[2] || "16");
const password = randomBytes(Math.ceil(length * 0.75))
  .toString("base64")
  .replace(/[+/=]/g, "")
  .slice(0, length);

const clip = Bun.spawn(["xclip", "-selection", "clipboard"], {
  stdin: new Response(password).body,
});
await clip.exited;

await Bun.spawn(["notify-send", "ScriptKitten", `Password copied! (${length} chars)`]).exited;

console.log(password);
