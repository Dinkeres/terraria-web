// kaisraria.luvrookie1.workers.dev: every request is answered from the GitHub Pages site, unchanged, plus
// the cross-origin isolation headers .NET's threads need (so the page needn't reload itself through sw.js).
// Same as Horizon's mcbrowser worker. The site has no game files; players load their own.
const ORIGIN = "https://dinkeres.github.io/terraria-web";

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const upstream = await fetch(ORIGIN + url.pathname + url.search, {
      method: request.method,
      headers: { "Accept-Encoding": request.headers.get("Accept-Encoding") || "" },
      redirect: "manual",
    });
    // GitHub's own redirects (a folder without its slash) point back at this address.
    const location = upstream.headers.get("Location");
    if (location && location.startsWith(ORIGIN)) {
      return Response.redirect(url.origin + location.slice(ORIGIN.length), upstream.status);
    }
    const response = new Response(upstream.body, upstream);
    response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
    response.headers.set("Cross-Origin-Embedder-Policy", "require-corp");
    response.headers.set("Cross-Origin-Resource-Policy", "same-origin");
    return response;
  },
};
