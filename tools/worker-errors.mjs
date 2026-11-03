// Debug aid: print uncaught exceptions (with stacks) from the page's worker threads via the Chrome DevTools
// protocol. .NET's game thread runs in a worker, so wasm traps there never reach page.on("pageerror").
// Usage: node tools/worker-errors.mjs [url] [seconds]
import { chromium } from "playwright";
const [url = "http://localhost:5000/", secs = "40"] = process.argv.slice(2);
const ctx = await chromium.launchPersistentContext(".pw-profile", { viewport: { width: 1280, height: 720 }, args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist", ...(process.env.CHROME_FLAGS ? process.env.CHROME_FLAGS.split(" ") : [])] });
const page = ctx.pages()[0] ?? await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
let id = 1;
const attach = async (client, params) => {
	await client.send("Target.setAutoAttach", params);
};
cdp.on("Target.attachedToTarget", ({ sessionId, targetInfo }) => {
	const send = (method, p = {}) => cdp.send("Target.sendMessageToTarget", { sessionId, message: JSON.stringify({ id: id++, method, params: p }) }).catch(() => {});
	send("Runtime.enable");
	send("Target.setAutoAttach", { autoAttach: true, waitForDebuggerOnStart: false, flatten: false });
	send("Runtime.runIfWaitingForDebugger");
});
cdp.on("Target.receivedMessageFromTarget", ({ message }) => {
	const m = JSON.parse(message);
	if (m.method === "Runtime.exceptionThrown") {
		const d = m.params.exceptionDetails;
		console.log("WORKER EXCEPTION:", d.exception?.description ?? d.text);
		for (const f of d.stackTrace?.callFrames ?? []) console.log("   at", f.functionName || "?", f.url.split("/").pop(), f.lineNumber, f.columnNumber);
	}
	if (m.method === "Target.attachedToTarget") { /* nested worker: messages arrive wrapped; handled by autoAttach above */ }
});
await attach(cdp, { autoAttach: true, waitForDebuggerOnStart: false, flatten: false });
page.on("console", (msg) => { if (/signature|RuntimeError|Launch failed/.test(msg.text())) console.log("console:", msg.text().slice(0, 300)); });
await page.goto(url);
if (process.env.MOVE_AT) { await page.waitForTimeout(+process.env.MOVE_AT * 1000); console.log("moving mouse"); page.on("crash", () => console.log("PAGE CRASHED")); await page.mouse.move(640, 300).catch((e) => console.log("move failed:", e.message)); }
await page.waitForTimeout(+secs * 1000);
await ctx.close();
