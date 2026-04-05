# ScriptKitten — Claude instructions

## Icon convention

Every script icon **must** include a small black flag in the top-left corner.
This makes ScriptKitten scripts instantly recognisable in Ulauncher's app list.

### Template

Base all new icons on `icons/_template.svg`. It already contains the flag snippet.

### Corner ribbon snippet (paste just before `</svg>`, always last so it renders on top)

The `<defs>` block must also include the clipPath (already in `_template.svg`):

```svg
<clipPath id="round"><rect width="64" height="64" rx="14"/></clipPath>
```

```svg
<!-- Corner ribbon (top-left) -->
<polygon points="0,0 32,0 0,32" fill="black" clip-path="url(#round)"/>
```

### Icon file naming

Icon filename must match the script filename exactly (without `.ts`):
- `scripts/my-script.ts` → `icons/my-script.svg`

`_register.ts` picks up the matching SVG automatically.

### After adding a new icon

```bash
bun run register
```
