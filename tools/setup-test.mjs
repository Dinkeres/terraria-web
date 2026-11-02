// End-to-end test of the player setup path in a FRESH browser profile:
// pick the real tModLoader + Terraria folders via the file inputs, copy, launch, wait for the main menu.
// Usage: node tools/setup-test.mjs <tModLoader dir> <Terraria dir> <screenshot.png>
import { chromium } from "playwright";
import { mkdtempSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
const [tml, terraria, shot] = process.argv.slice(2);
const ctx = await chromium.launchPersistentContext(mkdtempSync(join(tmpdir(), "tw-fresh-")), {
	viewport: { width: 1280, height: 720 },
	args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"],
});
const page = ctx.pages()[0] ?? await ctx.newPage();
const t0 = Date.now(), stamp = () => ((Date.now() - t0) / 1000).toFixed(1).padStart(6);
const logs = [];
page.on("console", (m) => { const l = `${stamp()} ${m.text()}`; logs.push(l); if (/status\]|Launch failed|Calling MonoLaunch|FATAL|Indexed/.test(l)) console.log(l); });
await page.goto("http://localhost:5000/?args=-watch");
await page.waitForSelector("#setup:not([hidden])");
await page.setInputFiles("#pick-tml", tml);
await page.setInputFiles("#pick-terraria", terraria);
console.log(stamp(), "picked:", await page.textContent("#tml-state"), "|", await page.textContent("#terraria-state"));
await page.click("#go");
for (let i = 0; i < 1500 && !logs.some((l) => /showSplash=False/.test(l) || /Launch failed/.test(l)); i++) await page.waitForTimeout(1000);
await page.waitForTimeout(3000);
await page.screenshot({ path: shot });
console.log(stamp(), logs.some((l) => /showSplash=False/.test(l)) ? "RESULT: main menu reached" : "RESULT: FAILED");
await ctx.close();
