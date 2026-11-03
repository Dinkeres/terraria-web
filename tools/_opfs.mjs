import { chromium } from "playwright";
const ctx = await chromium.launchPersistentContext(".pw-profile", { viewport: { width: 800, height: 600 } });
const page = ctx.pages()[0] ?? await ctx.newPage();
await page.goto("http://localhost:5000/__inspect");
console.log(await page.evaluate(async () => {
	const root = await navigator.storage.getDirectory(); let dll = "missing";
	try { await (await root.getDirectoryHandle("tModLoader")).getFileHandle("tModLoader.dll"); dll = "present"; } catch {}
	return JSON.stringify({ dll, usageMB: Math.round((await navigator.storage.estimate()).usage / 1e6) });
}));
await ctx.close();
