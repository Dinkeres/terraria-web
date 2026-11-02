# Needs the owner's review

1. (done 2026-11-02) Public repo: github.com/Dinkeres/terraria-web
2. **Speed trade-off (later).** The fast way (what terraria-wasm did) compiles Terraria's own code
   into the website, which would mean hosting the game. We are doing the slower, rule-safe way
   (your copy is loaded in your browser). If it turns out too slow, a possible middle ground is
   each PC player building a fast version privately on their own machine. Decide only if needed.
3. **Try it yourself (local only for now).** With the dev server running, open http://localhost:5000
   in Chrome, click "Choose Steam games folder" and pick `S:\SteamLibrary\steamapps\common`.
   First copy ≈5–7 min; startup ≈1.5 min. Chrome may refuse folders under `C:\Program Files` for
   other players (browser safety rule) — if a friend hits that, we add a "pick each folder" option.
4. **Hosting.** Not hosted anywhere yet. Hosting needs COOP/COEP headers (GitHub Pages via a
   service worker like Kaiser, or the Cloudflare account). Ask before publishing.
