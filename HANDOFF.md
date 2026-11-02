# Terraria in the browser: project handoff

Written 2026-11-02 at the end of the Kaiser emulator session, to start this project in a new folder.
Read this whole file first. Facts marked **(verify)** were not checked yet.

## What the owner wants

- **Terraria playable in the browser**, with **co-op with friends** (they all own Terraria), and
  **mods later** (tModLoader). Played on **Chromebooks and PCs**; "optimization later".
- Like their Minecraft project **Horizon**: the site never contains the game; each player points it at
  **their own installed copy** and the browser loads it locally.
- Eventually part of a **hub** with Kaiser (browser emulator) and Horizon, sharing one account.
- Work style: autonomous ("answer questions yourself, do whatever it takes"), but stop and ask before
  anything hard to undo or outward-facing. Plain-language updates; the owner is not a programmer.

## Hard rules

- **Every player uses their own Terraria.** Never commit, upload, host or bundle Terraria's (or
  tModLoader's) files, assets or decompiled code. `.gitignore` the game folder and any extracted data.
  The game is read from the player's disk (File System Access API / file picker → OPFS/IndexedDB).
- Never download game files, keys or cracks from the internet. The owner reinstalls Terraria from
  their own account on this PC for development.
- New code goes in a **new repository** (ask the owner before creating it on GitHub). Don't change
  other repos (Kaiser `Dinkeres/nextgen-emulator`, Horizon `Dinkeres/horizon`/`horizon-test`) without
  asking; never push to `horizon-rust/horizon` (upstream).
- Never commit secrets. Never spend money or sign up for services.
- Commit after each working step. Keep docs (README, DECISIONS, NEEDS_REVIEW) as you go.

## Why this is feasible (and Smash/Elden Ring were not)

- Terraria is a **.NET (C#) game on XNA/FNA**. .NET runs in browsers as WebAssembly (`browser-wasm`,
  with ahead-of-time compilation available). No CPU translation needed, unlike 3DS or Elden Ring.
- **FNA** (open-source XNA reimplementation, Ms-PL) has native parts (FNA3D, FAudio, SDL) that can be
  built with Emscripten; FNA3D's OpenGL path maps to WebGL2 **(verify current FNA web/Emscripten
  support and docs)**.
- Community precedent: projects ran **Celeste and Terraria in the browser from the player's own files**
  (Mercury Workshop, roughly 2024–2025) **(verify: find the repos, read how they did it, check their
  licenses before reusing anything)**.
- Platform detail: the Windows build of Terraria uses Microsoft XNA; the Linux/macOS builds use FNA
  **(verify)**. **tModLoader** (free on Steam for Terraria owners) is FNA-based on every platform and
  runs on modern .NET **(verify version)**, so it may be the better input, and it brings mods.

## Plan (stages, each with a go/no-go)

1. **Recon:** install Terraria (+ tModLoader) from the owner's account. Inventory the game folder
   (assemblies, .NET version, XNA vs FNA, native libs, content formats .xnb/.xwb, size). Study the
   precedents. Write the design doc (`docs/.../design.md`).
2. **Boot:** .NET wasm host + FNA (FNA3D→WebGL2, FAudio→Web Audio, SDL input) loading the player's own
   assemblies from browser storage; reach the title screen.
3. **Play:** single player, saves (players `.plr`, worlds `.wld`) in IndexedDB, keyboard/mouse/
   gamepad, then touch for Chromebooks.
4. **Co-op:** Terraria's multiplayer is client/server over TCP (port 7777). Run the server inside
   the host's browser and tunnel its TCP stream over Kaiser-style rooms (WebRTC data channels with
   relay through the Cloudflare signaling worker), exactly like Kaiser's GBA link and Quetzal co-op.
5. **Mods:** tModLoader; loading mod assemblies at run time in the browser (IL interpreter path).
6. **Speed** (AOT, threading), then join the hub.

## Existing infrastructure you can reuse

**Accounts (shared with Kaiser and Horizon).** Cloudflare Worker `horizon-test`:
`https://horizon-test.luvrookie1.workers.dev`. Source: Horizon repo
`C:\Users\luvro\Downloads\MCP\horizon\web\backend` (branch `web-test`, published to
`github.com/Dinkeres/horizon-test` `main`; deploy with `web/backend/node_modules/.bin/wrangler deploy`;
it's the owner's own worker and the owner approved changes for Kaiser features, ask again for new ones).
- `POST /api/signup {email, username, password}` → `{token, username}` (username 3–16 `[A-Za-z0-9_]`,
  password ≥ 8); `POST /api/login {email, password}`; `GET /api/me` (Bearer token) → `{username}`.
- Cloud saves: `GET /api/saves`; `GET|PUT /api/saves/<32 hex id>/<sram|state>?t=<ms>`. Values ≤ 1.9 MB
  (Durable Object SQLite limit), 64 MB per account. Terraria worlds can be larger: add chunking or a
  new kind/endpoint.
- CORS: `ALLOWED_ORIGINS` in `web/backend/wrangler.toml`; add the new site's origin.
- Browser side reference: Kaiser `src/app/account.ts` (token in localStorage key
  `horizon-test-session` as `{"token": "..."}`, shared automatically by sites on the same origin) and
  `src/app/cloud.ts` (newest-wins sync, local backup of anything replaced).

**Multiplayer signaling.** `wss://kaiser-signal.luvrookie1.workers.dev`, rooms at `/room/new` and
`/room/<CODE>` (Durable Object per room). Source: Kaiser `server/cloudflare/worker.js`; browser side:
Kaiser `src/net/session.ts` (lobby, WebRTC mesh, ordered "ctl" + unordered "input" data channels,
automatic relay through the server when WebRTC can't connect). Kaiser requires an account to play online.

**Kaiser** (for the hub later): `C:\Users\luvro\Downloads\KaiserEmlator\nextgen-emulator`,
github.com/Dinkeres/nextgen-emulator, live at https://dinkeres.github.io/nextgen-emulator/ and the
owner's Cloudflare copy https://kaiseremu.luvrookie1.workers.dev (same build).

**Tooling on this PC (Windows 11):** Node 24, Git Bash + PowerShell, WSL Ubuntu with emsdk at
`~/ngemu/emsdk` (use it for FNA's native libs), devkitPro (not needed here), `gh` CLI logged in as
Dinkeres, `wrangler` logged in to the owner's Cloudflare account (luvrookie1). .NET SDK: check
(`dotnet --info`); the `wasm-tools` workload will be needed.

## Lessons from the Kaiser session

- Test in real browsers with Playwright (two separate browser contexts = two players/devices);
  `chromium` from the `playwright` package works.
- When testing accounts, run a **local copy** of the account worker (`wrangler dev --local`) and route
  the live URL to it in Playwright; don't create test accounts on the live server.
- Chromebooks are the weak target: watch frame cost, avoid big per-frame copies (Kaiser's DS lag came
  from 6 MB rewind snapshots, not emulation).
- Cross-origin isolation (needed for threads/SharedArrayBuffer) on GitHub Pages comes from a service
  worker that adds COOP/COEP headers (Kaiser `public/sw.js`).
