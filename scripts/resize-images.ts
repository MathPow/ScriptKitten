/**
 * resize-images.ts — Resize all images in a folder using ImageMagick.
 * Requires: imagemagick (convert command)
 * Usage: bun run scripts/resize-images.ts
 */
import { readdirSync } from "fs";
import { join, extname } from "path";

function zenity(...args: string[]): string | null {
  const { stdout, exitCode } = Bun.spawnSync(["zenity", ...args]);
  if (exitCode !== 0) return null;
  return stdout.toString("utf8").trim();
}

const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".bmp", ".gif"]);

const folder = zenity("--file-selection", "--directory", "--title=Select folder with images");
if (!folder) process.exit(0);

const sizeInput = zenity(
  "--entry",
  "--title=Resize images",
  "--text=Target size (e.g. 1920x1080, 50%, 800x):"
);
if (!sizeInput) process.exit(0);

const files = readdirSync(folder).filter((f) => IMAGE_EXTS.has(extname(f).toLowerCase()));

if (files.length === 0) {
  zenity("--info", "--text=No images found in folder.");
  process.exit(0);
}

let done = 0;
for (const file of files) {
  const fullPath = join(folder, file);
  const { exitCode } = Bun.spawnSync(["convert", fullPath, "-resize", sizeInput, fullPath]);
  if (exitCode === 0) done++;
}

zenity("--info", `--text=${done}/${files.length} image(s) resized to ${sizeInput}.`);
