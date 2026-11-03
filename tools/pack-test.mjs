// End-to-end test of the game-pack path on a given site URL in a FRESH browser profile:
// load the .tar via the setup screen, unpack into OPFS, launch, wait for the loading screen to clear.
// Usage: node tools/pack-test.mjs <url> <gamepack.tar> <screenshot.png>
import { chromium } from "playwright";
import { mkdtempSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
const [url, pack, shot] = process.argv.slice(2);
const ctx = await chromium.launchPersistentContext(mkdtempSync(join(tmpdir(), "tw-pack-")), {
	viewport: { width: 1280, height: 720 }, args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"],
});
const page = ctx.pages()[0] ?? await ctx.newPage();
const t0 = Date.now(), stamp = () => ((Date.now() - t0) / 1000).toFixed(1).padStart(6);
let last = "";
page.on("console", (m) => { const t = m.text(); if (/status\]/.test(t) && !/Unpacking/.test(t)) console.log(stamp(), t); if (/Unpacking/.test(t)) last = t; if (/Launch failed|FATAL/.test(t)) console.log(stamp(), t); });
page.on("pageerror", (e) => console.log(stamp(), "pageerror", e.message));
await page.goto(url);
await page.waitForSelector("#setup:not([hidden])", { timeout: 60000 });
console.log(stamp(), "setup shown; crossOriginIsolated =", await page.evaluate(() => crossOriginIsolated));
await page.setInputFiles("#pick-pack", pack);
await page.waitForSelector("#loading", { state: "hidden", timeout: 1500000 });
console.log(stamp(), "last unpack status:", last, "| RESULT: game ready (loading screen gone)");
await page.waitForTimeout(3000);
await page.screenshot({ path: shot });
await ctx.close();
