// Debug aid: after a mouse move (or at a given time), pause the page's main thread and every worker with the
// DevTools protocol and print where each one is stuck (wasm function names need a build with symbols).
// Usage: MOVE_AT=<s> node tools/hang-stacks.mjs <url>
import { chromium } from "playwright";
const url = process.argv[2] ?? "http://localhost:5000/";
const ctx = await chromium.launchPersistentContext(".pw-profile", { viewport: { width: 1280, height: 720 }, args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"] });
const page = ctx.pages()[0] ?? await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
const sessions = new Map(); let id = 1;
const sendTo = (sessionId, method, params = {}) => cdp.send("Target.sendMessageToTarget", { sessionId, message: JSON.stringify({ id: id++, method, params }) }).catch(() => {});
const show = (who, frames) => { console.log(`== ${who}`); for (const f of frames.slice(0, 14)) console.log("   ", f.functionName || "?", (f.url || "").split("/").pop()); };
cdp.on("Target.attachedToTarget", ({ sessionId, targetInfo }) => { sessions.set(sessionId, targetInfo.url.split("/").pop()); sendTo(sessionId, "Debugger.enable"); sendTo(sessionId, "Runtime.runIfWaitingForDebugger"); });
cdp.on("Target.receivedMessageFromTarget", ({ sessionId, message }) => { const m = JSON.parse(message); if (m.method === "Debugger.paused") show("worker " + sessions.get(sessionId) + " " + sessionId.slice(0, 6), m.params.callFrames); });
cdp.on("Debugger.paused", (p) => { show("MAIN THREAD", p.callFrames); for (let a = p.asyncStackTrace; a; a = a.parent) { console.log("  -- async:", a.description); for (const f of a.callFrames.slice(0, 8)) console.log("      ", f.functionName || "?", (f.url || "").split("/").pop(), f.lineNumber, f.columnNumber); } });
await cdp.send("Target.setAutoAttach", { autoAttach: true, waitForDebuggerOnStart: false, flatten: false });
await cdp.send("Debugger.enable");
await cdp.send("Debugger.setAsyncCallStackDepth", { maxDepth: 32 });
await page.goto(url);
await page.waitForTimeout(+(process.env.MOVE_AT ?? 75) * 1000);
console.log("moving mouse");
page.mouse.move(640, 300).catch(() => {});
await new Promise((r) => setTimeout(r, 1500));
cdp.send("Debugger.pause").catch((e) => console.log("main pause failed", e.message));
for (const s of sessions.keys()) sendTo(s, "Debugger.pause");
await new Promise((r) => setTimeout(r, 4000));
await ctx.close().catch(() => {});
process.exit(0);
