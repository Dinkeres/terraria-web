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
- 2026-11-02 — Patch the player's assemblies in memory with Cecil at load time (Patches.cs), never on
  disk/server. Tools: Stub (empty method), StubCtor, RedirectCalls (call/callvirt/newobj/ldftn → our
  static shim), RetypeLocals. Each entry carries its reason.
- 2026-11-02 — Present as Linux to tML/ReLogic (IsOSPlatform redirect); library resolution follows a
  Linux deps.json (runtimes/linux/lib first — lib/net8.0 Steamworks.NET is a reference assembly).
- 2026-11-02 — FNA: upstream 26.04 + tModLoader's FNA fork changes (Game(bool), public FNA3D,
  FNA3D_SafeAccess/ThreadCheck, finalizer behaviour) in FNA.patch. SDL2 calls from tML/ReLogic go to
  SDL3 via Sdl2Shim.
- 2026-11-02 — No Steam in the browser (SocialMode.None); Steamworks calls fail softly as tML expects.
- 2026-11-02 — AES for .plr/achievements: own managed AES (ManagedAes.cs), FIPS-197 self-test +
  tests/aes-crosscheck.sh against real .NET AES.
- 2026-11-02 — Saves: Terraria's Linux save dir symlinked into OPFS (/libsdl/Saves).
