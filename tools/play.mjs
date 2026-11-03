// Drive the game: wait until the frame loop runs, then do steps.
// Usage: node tools/play.mjs <url> <outdir> '<steps json>'
// steps: [{"click":[x,y]}, {"wait":2}, {"shot":"name"}, {"type":"text"}, {"key":"Enter"}, {"waitlog":"regex", "timeout":120}]
import { chromium } from "playwright";
import { mkdirSync } from "fs";

const [url, out, stepsJson = "[]"] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const ctx = await chromium.launchPersistentContext(".pw-profile", {
	viewport: { width: 1280, height: 720 },
	args: process.env.GPU || true ? ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist", "--enable-unsafe-webgpu"] : ["--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
const page = ctx.pages()[0] ?? await ctx.newPage();
const t0 = Date.now();
const stamp = () => ((Date.now() - t0) / 1000).toFixed(1).padStart(6);
const logs = [];
page.on("console", (m) => { const l = `${stamp()} [${m.type()}] ${m.text()}`; logs.push(l); console.log(l); });
page.on("pageerror", (e) => console.log(`${stamp()} [pageerror] ${e.message}`));
async function waitLog(re, secs) {
	const rx = new RegExp(re);
	for (let i = 0; i < secs * 4; i++) { if (logs.some((l) => rx.test(l))) return true; await page.waitForTimeout(250); }
	console.log(`${stamp()} [play] timeout waiting for /${re}/`);
	return false;
}
await page.goto(url);
await page.waitForSelector("#loading", { state: "hidden", timeout: 600000 }); // loading screen clears when the menu takes input
await page.bringToFront();
await page.evaluate(() => { document.getElementById("canvas").focus(); window.dispatchEvent(new FocusEvent("focus")); });
for (const s of JSON.parse(stepsJson)) {
	console.log(`${stamp()} [play] ${JSON.stringify(s)}`);
	if (s.click) { await page.mouse.move(...s.click); await page.waitForTimeout(150); await page.mouse.down(); await page.waitForTimeout(120); await page.mouse.up(); }
	if (s.wait) await page.waitForTimeout(s.wait * 1000);
	if (s.type) await page.keyboard.type(s.type, { delay: 80 });
	if (s.key) await page.keyboard.press(s.key);
	if (s.waitlog) { logs.length = 0; await waitLog(s.waitlog, s.timeout ?? 120); }
	if (s.shot) await page.screenshot({ path: `${out}/${s.shot}.png` }).catch((e) => console.log("shot failed " + e.message));
}
await ctx.close();
