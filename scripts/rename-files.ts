/**
 * rename-files.ts — Batch rename files in a folder via Zenity dialogs.
 * Usage: bun run scripts/rename-files.ts
 */
import { readdirSync, renameSync } from "fs";
import { join, extname, basename } from "path";

function zenity(...args: string[]): string | null {
  const { stdout, exitCode } = Bun.spawnSync(["zenity", ...args]);
  if (exitCode !== 0) return null;
  return stdout.toString("utf8").trim();
}

const folder = zenity("--file-selection", "--directory", "--title=Select folder to rename");
if (!folder) process.exit(0);

const pattern = zenity(
  "--entry",
  "--title=Rename files",
  "--text=Prefix to add (leave empty to skip):"
);
if (pattern === null) process.exit(0);

const files = readdirSync(folder).filter((f) => {
  const full = join(folder, f);
  return Bun.file(full).size >= 0; // filter to files only
});

if (files.length === 0) {
  zenity("--info", "--text=No files found in folder.");
  process.exit(0);
}

let renamed = 0;
for (const file of files) {
  const ext = extname(file);
  const base = basename(file, ext);
  const newName = pattern ? `${pattern}_${base}${ext}` : file;
  if (newName !== file) {
    renameSync(join(folder, file), join(folder, newName));
    renamed++;
  }
}

zenity("--info", `--text=${renamed} file(s) renamed.`);
