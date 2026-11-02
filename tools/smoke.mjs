// Open the page in Chromium, print the console, save a screenshot.
// Uses a persistent profile (.pw-profile) so game files copied into OPFS survive between runs.
// Usage: node tools/smoke.mjs [url] [seconds] [screenshot.png]
import { chromium } from "playwright";

const [url = "http://localhost:5000/?dev", secs = "60", shot = "smoke.png"] = process.argv.slice(2);
const ctx = await chromium.launchPersistentContext(".pw-profile", {
	viewport: { width: 1280, height: 720 },
	args: ["--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
const page = ctx.pages()[0] ?? await ctx.newPage();
const t0 = Date.now();
const stamp = () => ((Date.now() - t0) / 1000).toFixed(1).padStart(6);
page.on("console", (m) => console.log(`${stamp()} [${m.type()}] ${m.text()}`));
page.on("pageerror", (e) => console.log(`${stamp()} [pageerror] ${e.message}`));
page.on("crash", () => console.log(`${stamp()} [crash] page crashed`));
await page.goto(url);
await page.waitForTimeout(Number(secs) * 1000);
if (process.env.DUMP) await page.evaluate(() => { const M = self.wasm?.Module; (M?._mono_wasm_print_thread_dump ?? M?.mono_wasm_print_thread_dump)?.(); }).catch((e) => console.log("dump failed: " + e.message));
await page.waitForTimeout(3000);
await page.screenshot({ path: shot }).catch((e) => console.log("screenshot failed: " + e.message));
await ctx.close();
