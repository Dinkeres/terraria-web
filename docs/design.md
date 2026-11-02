# Design: Terraria in the browser

Status: Stage 1 (recon) done 2026-11-02. Stage 2 (boot) in progress.

## Recon findings (this PC)

| | Terraria (Steam 105600) | tModLoader (Steam 1281930) |
|---|---|---|
| Location | `S:\SteamLibrary\steamapps\common\Terraria` | `S:\SteamLibrary\steamapps\common\tModLoader` |
| Size | 790 MB (mostly `Content/`: Wave Bank.xwb, Images, Fonts) | 271 MB, own `Content/` is 8 MB |
| Code | `Terraria.exe` (.NET Framework 4, **Microsoft XNA**, ReLogic.dll embedded) | `tModLoader.dll` (.NET 8, **FNA**), branch 1.4.4 |
| Native | Windows-only DLLs (XNA, Steam, RGB keyboards) | FNA3D/SDL per OS in `Libraries/Native` |

tModLoader reads vanilla art/sound from the Terraria folder, so a tML player needs both folders.

## Precedents

- **MercuryWorkshop/terraria-wasm** ("Terrarium"): no license, so we read it, never copy it.
  They decompile Terraria and **AOT-compile it into the website**. That was the only way they
  got playable speed (interpreted: ~2 FPS on .NET 8). Mods: "not feasible for now" (speed).
  We can't do this: the site would contain Terraria's code.
- **MercuryWorkshop/celeste-wasm**: small loader that `Assembly.Load`s the player's own
  `Celeste.exe` at run time and patches it in the browser (Everest/MonoMod). This is our model.
- **r58Playz/fna-wasm-threads** (MIT): .NET 10 + FNA template with threads, OPFS mounted at
  `/libsdl`, prebuilt Emscripten FNA3D/FAudio/SDL3/mojoshader. **Our base.**
- **r58Playz/MonoMod** (MIT): MonoMod port for wasm (detours), needed for tModLoader.

## Architecture

```
site (hosted, no game code)                     player's browser
  index.html + main.js  ── file picker ──▶  OPFS: /libsdl/Terraria/..., /libsdl/tModLoader/...
  _framework/ (.NET 10 runtime, FNA, loader)    loader (AOT) ── Assembly.Load ──▶ game dll (interpreted
                                                                                 + jiterpreter)
```

- The loader, FNA and the .NET libraries are AOT-compiled (fast, ours/open source).
- The game assembly is read from OPFS and runs on Mono's interpreter + jiterpreter.
- Any patching (Windows-only calls, Steam, sockets) happens in the browser with Mono.Cecil, on
  the player's copy, never on our server.

## Main risk

Speed of interpreted game code. Stage 2 go/no-go: measure FPS at the title screen and in a
world. If too slow, options in NEEDS_REVIEW.md.

## Input choice

Start with **tModLoader** (already FNA + modern .NET, so no XNA→FNA relinking, and mods come
later for free). Risks: it uses MonoMod detours at start-up (needs the wasm MonoMod port) and
Steam checks (stub them). Fallback: vanilla Terraria.exe with XNA references redirected to FNA.
