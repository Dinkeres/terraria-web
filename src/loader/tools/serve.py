#!/usr/bin/env python3
# Local dev server with the COOP/COEP headers threads need.
# Dev only: /dev-game/<tModLoader|Terraria>/... serves YOUR local install so tests can fill OPFS
# without the folder picker. Never deploy this server; the real site has no game files.
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import functools, os, sys

GAME_DIRS = {
    "tModLoader": os.environ.get("TW_TML", "/mnt/s/SteamLibrary/steamapps/common/tModLoader"),
    "Terraria": os.environ.get("TW_TERRARIA", "/mnt/s/SteamLibrary/steamapps/common/Terraria"),
}
# What the browser needs from each install (relative top-level entries); everything else is skipped.
SKIP = {"tModLoader": {"dotnet", "tModPorter", "ILLogs", "tModLoader-Logs", "DedicatedServerUtils", "EmptySteamDepot", "LaunchUtils"}}
ONLY = {"Terraria": {"Content"}}


@functools.lru_cache(maxsize=None)  # walking /mnt/s from WSL is slow; restart the server after game updates
def listing(name):
    root = GAME_DIRS[name]
    out = []
    for top in sorted(os.listdir(root)):
        if top in SKIP.get(name, ()) or (name in ONLY and top not in ONLY[name]):
            continue
        p = os.path.join(root, top)
        if os.path.isfile(p):
            out.append(f"{os.path.getsize(p)}\t{top}")
            continue
        for d, _, files in os.walk(p):
            for f in files:
                full = os.path.join(d, f)
                out.append(f"{os.path.getsize(full)}\t{os.path.relpath(full, root)}")
    return "\n".join(out)


class Handler(SimpleHTTPRequestHandler):
    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        ".mjs": "application/javascript",
        ".wasm": "application/wasm",
    }

    def do_GET(self):
        path = self.path.split("?", 1)[0]
        if path.startswith("/dev-game/") and path.endswith("/__list"):
            name = path.split("/")[2]
            body = listing(name).encode()
            self.send_response(200)
            self.send_header("Content-Type", "text/plain")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        super().do_GET()

    def translate_path(self, path):
        from urllib.parse import unquote
        path = unquote(path.split("?", 1)[0].split("#", 1)[0])
        if path.startswith("/dev-game/"):
            _, _, name, rest = path.split("/", 3)
            root = GAME_DIRS[name]
            full = os.path.realpath(os.path.join(root, rest))
            if not full.startswith(os.path.realpath(root)):
                return "/nonexistent"
            return full
        if path.startswith("/_framework"):
            return "bin/Release/net10.0/publish/wwwroot/_framework" + path[len("/_framework"):]
        return "wwwroot" + path

    def end_headers(self):
        self.send_header("Cross-Origin-Embedder-Policy", "require-corp")
        self.send_header("Cross-Origin-Opener-Policy", "same-origin")
        self.send_header("Cross-Origin-Resource-Policy", "same-origin")
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, *a):
        pass


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 5000
    # localhost only: this server can read the game folders
    ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()
