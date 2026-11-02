# Decisions

- 2026-11-02 — Load the player's game at run time (celeste-wasm style), not AOT-compiled into the
  site (terraria-wasm style). Reason: hard rule, the site never contains the game.
- 2026-11-02 — Base on r58Playz/fna-wasm-threads (MIT, .NET 10, threads, OPFS). terraria-wasm has
  no license, so none of its code is reused.
- 2026-11-02 — Target tModLoader first (FNA + .NET 8 already); vanilla Terraria.exe is the fallback.
- 2026-11-02 — Build in WSL (Linux); .NET 10 SDK installed user-local at `~/.dotnet` in WSL.
- 2026-11-02 — Game loop: call the game's own unmodified launch code. FNA's emscripten path
  (`emscripten_set_main_loop`, simulate_infinite_loop) unwinds out of `Game.Run()` into the browser
  frame loop without running `finally`/`Dispose`; verified in Chromium at 60 UPS
  (`?run` experiment in `src/loader`). .NET 10 doesn't resolve `DllImport("__Native")`, so FNA.patch
  points it at `fna_set_main_loop` in `Emscripten.c`. Watch for: Mono state after the unwind.
