# Terraria Web

Play **your own** copy of Terraria (via tModLoader) in the browser: https://dinkeres.github.io/terraria-web/

The site contains no game files. On first visit you either pick your `tModLoader` and `Terraria` folders
(from Steam's `steamapps\common`), or load a game pack made from your own install with
`tools/export-gamepack.sh` (for Chromebooks and other devices without Steam). The game is copied into the
browser's private storage once (~1 GB) and never sent anywhere. Characters and worlds are saved in the browser.

Works best in desktop Chrome/Edge. Status and design: `docs/design.md`, decisions: `DECISIONS.md`,
open questions: `NEEDS_REVIEW.md`.

## Build (Windows + WSL)

```
wsl -e bash tools/build.sh                 # interpreter build (fast to build)
TW_AOT=1 wsl -e bash tools/build.sh        # ahead-of-time build (slow to build, faster game)
bash tools/deploy-pages.sh                 # publish to GitHub Pages (gh-pages branch)
```

Based on [fna-wasm-threads](https://github.com/r58Playz/fna-wasm-threads) (MIT) and
[FNA](https://github.com/FNA-XNA/FNA) (Ms-PL), with changes from tModLoader's FNA fork.
