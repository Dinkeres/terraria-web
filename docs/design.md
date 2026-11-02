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

## Game loop (verified 2026-11-02)

The game calls `Game.Run()`, which never returns on desktop. In the browser FNA hands the loop to
`emscripten_set_main_loop(..., simulate_infinite_loop=1)`, which unwinds the stack back to the
browser; `finally` blocks and `using`/Dispose above it do not run. So tModLoader's own launcher
(`MonoLaunch.Main` → `Program.LaunchGame` → `new Main().Run()`) can be called unmodified.

## Status 2026-11-02 (end of day 1)

Working in Chromium from the player's own files: tModLoader boots, loads its (built-in) mod,
main menu, settings, character creation (typing, saving with AES), world creation (small world
≈3 min vs ≈20 s on desktop). See DECISIONS.md for every patch and why.

Speed (headless Chromium, software GPU, interpreter only): title/menu ≈10–13 game frames/s.
Next measurements: in-world FPS, and with the real GPU.

Speed plan, in order of expected gain:
1. AOT-compile what we may host: our loader, FNA, the .NET libraries (RunAOTCompilation). The game
   itself stays interpreted (jiterpreter).
2. Cache the patched tModLoader.dll in OPFS (Cecil currently re-patches it every start, ~5 s), and
   cache the content image index (~35 s on OPFS).
3. Real GPU path (WebGL2 via ANGLE) instead of software rendering in tests.
4. Profile hot game methods; consider "partial AOT" only if a legal route exists (see NEEDS_REVIEW).

Known gaps: MonoMod detours (mods with hooks — Calamity needs these), multiplayer sockets,
opening URLs/folders, music/sound not yet verified, startup time (~90 s to menu).
