// Benchmark: time until the menu is ready, then enter the first saved world and read Terraria's own
// update/draw counters. Uses the persistent test profile (.pw-profile), real GPU.
// Usage: node tools/bench.mjs [url]
import { chromium } from "playwright";
const url = process.argv[2] ?? "http://localhost:5000/?args=-watch";
const ctx = await chromium.launchPersistentContext(".pw-profile", { viewport: { width: 1280, height: 720 }, args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"] });
const page = ctx.pages()[0] ?? await ctx.newPage();
const t0 = Date.now(), sec = () => ((Date.now() - t0) / 1000).toFixed(1);
const watch = [];
page.on("console", (m) => { const t = m.text(); if (t.includes("[watch]")) watch.push(t); if (/Patched|Launch failed|FATAL/.test(t)) console.log(sec(), t.slice(0, 120)); });
await page.goto(url);
await page.waitForSelector("#loading", { state: "hidden", timeout: 600000 });
console.log(sec(), "MENU READY");
const click = async (x, y) => { await page.mouse.move(x, y); await page.waitForTimeout(150); await page.mouse.down(); await page.waitForTimeout(120); await page.mouse.up(); };
await page.waitForTimeout(3000);
await click(640, 248); await page.waitForTimeout(4000); await click(347, 310); await page.waitForTimeout(4000); await click(347, 310); // play buttons at 1280x720
const tw = Date.now();
while (!watch.some((l) => l.includes("gameMenu=False")) && Date.now() - tw < 300000) await page.waitForTimeout(500);
console.log(sec(), "IN WORLD after", ((Date.now() - tw) / 1000).toFixed(1), "s");
watch.length = 0;
await page.waitForTimeout(20000);
await page.screenshot({ path: process.env.SHOT ?? "bench.png" });
const ups = watch.map((l) => +(/updatesCountedForFPS=(\d+)/.exec(l)?.[1] ?? 0)).filter((n) => n > 0);
console.log("in-world updates/s samples:", ups.join(" "), "| avg", (ups.reduce((a, b) => a + b, 0) / ups.length).toFixed(1));
await ctx.close();
