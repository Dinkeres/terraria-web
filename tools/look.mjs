// Screenshot the menu and the first saved world at a given window size (persistent test profile, GPU).
// Usage: node tools/look.mjs <width> <height> <out prefix>
import { chromium } from "playwright";
const [w, h, out] = process.argv.slice(2);
const ctx = await chromium.launchPersistentContext(".pw-profile", { viewport: { width: +w, height: +h }, args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"] });
const page = ctx.pages()[0] ?? await ctx.newPage();
const watch = [];
page.on("console", (m) => { const t = m.text(); if (t.includes("[watch]")) watch.push(t); if (/Resolution changed|Resize failed/.test(t)) console.log(t); });
await page.goto("http://localhost:5000/?args=-watch");
await page.waitForSelector("#loading", { state: "hidden", timeout: 600000 });
await page.waitForTimeout(4000);
await page.screenshot({ path: `${out}-menu.png` });
const cx = +w / 2, click = async (x, y) => { await page.mouse.move(x, y); await page.waitForTimeout(150); await page.mouse.down(); await page.waitForTimeout(120); await page.mouse.up(); };
const ws = (re) => watch.at(-1)?.match(re)?.[1];
console.log("game screen:", ws(/screenWidth=(\d+)/), "x", ws(/screenHeight=(\d+)/));
await ctx.close();
