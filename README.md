# ScriptKitten

Homemade [ScriptKit](https://www.scriptkit.com/) for Linux — Bun + TypeScript + Ulauncher.

## Setup

```bash
cd ~/repos/ScriptKitten
bun install
```

## Register scripts with Ulauncher

After adding or removing a script:

```bash
bun run register
# or directly:
bun run scripts/_register.ts
```

This writes `.desktop` files to `~/.local/share/applications/` prefixed with `scriptkitten-`.
Ulauncher picks them up automatically — search `SK:` to filter them.

## Add a new script

1. Create `scripts/your-script-name.ts`
2. Run `bun run register`
3. Open Ulauncher → type `SK: Your Script Name` → Enter

## Included scripts

| Script | What it does |
|---|---|
| `generate-password.ts` | Generates a random password and copies it to clipboard |
| `clipboard-clean.ts` | Strips formatting/trailing whitespace from clipboard |
| `rename-files.ts` | Batch-prefix rename files in a folder (Zenity UI) |
| `resize-images.ts` | Resize all images in a folder via ImageMagick (Zenity UI) |

## Dependencies

- [Bun](https://bun.sh/)
- `xclip` — clipboard access
- `zenity` — GTK dialogs for scripts with a UI
- `imagemagick` — for `resize-images.ts`
- `notify-send` (libnotify) — desktop notifications

```bash
sudo apt install xclip zenity imagemagick libnotify-bin
```
