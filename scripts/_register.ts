/**
 * _register.ts — Scan scripts/ and create .desktop entries for Ulauncher.
 * Run: bun run scripts/_register.ts
 */
import { readdirSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { basename, resolve } from "path";

const scriptsDir = resolve(import.meta.dir);
const iconsDir = resolve(import.meta.dir, "../icons");
const appsDir = `${process.env.HOME}/.local/share/applications`;

// Resolve bun's absolute path so .desktop files work from Ulauncher's minimal env
const { stdout: bunPathRaw } = Bun.spawnSync(["which", "bun"]);
const bunBin = bunPathRaw.toString("utf8").trim() || `${process.env.HOME}/.bun/bin/bun`;

mkdirSync(appsDir, { recursive: true });

let count = 0;
for (const file of readdirSync(scriptsDir)) {
  if (file.startsWith("_") || !file.endsWith(".ts")) continue;

  const scriptName = basename(file, ".ts");
  const displayName = scriptName
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const iconPath = `${iconsDir}/${scriptName}.svg`;
  const icon = existsSync(iconPath) ? iconPath : "utilities-terminal";

  const desktopPath = `${appsDir}/scriptkitten-${scriptName}.desktop`;
  writeFileSync(
    desktopPath,
    `[Desktop Entry]
Name=SK: ${displayName}
Exec=${bunBin} run ${scriptsDir}/${file}
Icon=${icon}
Type=Application
Categories=Utility;ScriptKitten;
Terminal=false
`
  );

  console.log(`  registered: SK: ${displayName} → ${desktopPath}`);
  count++;
}

console.log(`\n✓ ${count} script(s) registered.`);
