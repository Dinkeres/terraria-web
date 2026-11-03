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

Speed (interpreter only, no AOT yet): in a small world ≈50–53 game frames/s with the GPU (Chromium + ANGLE/D3D11, this PC); ≈10 with software rendering. Menus ≈45 (GPU).
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

## Co-op plan (Stage 4, with the Horizon friends system)

The accounts worker (horizon-test) already has friends, presence ("hosting"), invite-only mode and
**visits**: a visitor's WebSocket and the host's `/tunnel` WebSocket are relayed byte-for-byte by the
worker (`web/backend/src/social.js` visit/tunnel). https://dinkeres.github.io is already an allowed
origin, so no backend change is needed. One visit = one Terraria TCP connection.

- Host: the page runs the player's client plus a **tModLoader dedicated server** (same files, `-server`)
  in a hidden same-origin frame. The server's TcpListener/TcpSocket are patched to a JS-fed listener;
  the local client connects over a MessageChannel, friends arrive as `visitor` tunnels.
- Friend: patched TcpSocket over the visit WebSocket. Joining = clicking the host in the friends list.
- Risks: two .NET instances ≈ 2× memory (Chromebooks with 4 GB will struggle); server tick speed in the
  interpreter.

## AOT (ahead-of-time) findings, 2026-11-03

`TW_AOT=1 tools/build.sh` builds with RunAOTCompilation (trimmer with every assembly rooted).
- Fixed: SDL window-flag width mismatch (FNA.patch) -> "function signature mismatch" at window creation.
- Result: menu in ~55 s instead of ~90 s.
- Blocker: Mono aborts with `interp.c:3420` (couldn't compile an interp-entry wrapper) as soon as
  precompiled framework code on a **thread-pool thread** calls into the interpreted game (tasks,
  async asset loads, mod loading). Not caused by IL stripping; forcing immediate asset loads only moves
  the crash; leaving the framework interpreted is impossible (the runtime needs its AOT wrappers).
- Next step if revisited: a custom-built Mono runtime with assert messages on, to name the missing
  wrapper signatures and pre-generate them (or a runtime fix).
