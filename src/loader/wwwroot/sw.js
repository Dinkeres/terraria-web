// Service worker (adapted from Kaiser's sw.js, same idea as coi-serviceworker, MIT):
// (1) adds COOP/COEP so the page is cross-origin isolated on hosts that can't set headers (GitHub Pages);
//     .NET threads need SharedArrayBuffer;
// (2) caches the engine (_framework, hashed file names = immutable) so later visits start faster.
const VERSION = "terraria-web-1";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

function isolate(res) {
	if (!res || res.status === 0 || res.type === "opaque") return res;
	const h = new Headers(res.headers);
	h.set("Cross-Origin-Opener-Policy", "same-origin");
	h.set("Cross-Origin-Embedder-Policy", "require-corp");
	h.set("Cross-Origin-Resource-Policy", "cross-origin");
	return new Response(res.body, { status: res.status, statusText: res.statusText, headers: h });
}

self.addEventListener("fetch", (e) => {
	const req = e.request;
	if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
	if (req.cache === "only-if-cached" && req.mode !== "same-origin") return;
	const url = new URL(req.url);
	const immutable = /\/_framework\/.+\.[0-9a-z]{8,}\.(wasm|js|dat)$/.test(url.pathname);
	e.respondWith((async () => {
		const cache = await caches.open(VERSION);
		if (immutable) {
			const hit = await cache.match(req);
			if (hit) return isolate(hit);
			const res = await fetch(req);
			if (res.ok) cache.put(req, res.clone());
			return isolate(res);
		}
		try { return isolate(await fetch(req)); }
		catch { const hit = await cache.match(req); if (hit) return isolate(hit); throw new Error("offline"); }
	})());
});
