// Open the page in Chromium, print the console, save a screenshot.
// Usage: node tools/smoke.mjs [url] [seconds] [screenshot.png]
import { chromium } from "playwright";

const [url = "http://localhost:5000/", secs = "20", shot = "smoke.png"] = process.argv.slice(2);
const browser = await chromium.launch({ args: ["--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on("console", (m) => console.log(`[${m.type()}] ${m.text()}`));
page.on("pageerror", (e) => console.log(`[pageerror] ${e.message}`));
await page.goto(url);
await page.waitForTimeout(Number(secs) * 1000);
console.log("crossOriginIsolated:", await page.evaluate(() => crossOriginIsolated));
await page.screenshot({ path: shot });
await browser.close();
