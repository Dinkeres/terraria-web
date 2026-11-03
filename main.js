// Terraria Web loader page.
// Game files live in OPFS (browser storage), which C# sees at /libsdl:
//   /libsdl/tModLoader/...        the player's tModLoader install
//   /libsdl/Terraria/Content/...  the player's vanilla Terraria content
const $ = (id) => document.getElementById(id);
// Ads in natural breaks: our loading screen (#ad-slot) and while a world loads (#ad-break). Off until you have
// an ad account; put its code in index.html and set this to true. window.kaisrariaAdBreak(kind) is called at
// each break, for ad SDKs that want a call (e.g. Google H5 Games Ads adBreak()).
const ADS_ENABLED = false;
// Donation page (Ko-fi / GitHub Sponsors). Empty = the support link stays hidden.
const SUPPORT_URL = "";
if (SUPPORT_URL) { $("support").href = SUPPORT_URL; $("support").hidden = false; }
const params = new URLSearchParams(location.search);
const status = (t) => { $("load-stage").textContent = t; console.debug("[status] " + t); };
const progress = (frac) => { $("load-bar").style.width = frac == null ? "" : `${Math.round(frac * 100)}%`; $("load-bar-wrap").classList.toggle("indeterminate", frac == null); };

// --- cross-origin isolation (threads need SharedArrayBuffer). GitHub Pages can't send COOP/COEP headers,
// so sw.js adds them; the first visit reloads once after the worker takes control.
if (!crossOriginIsolated && "serviceWorker" in navigator && !params.has("nosw")) {
	await navigator.serviceWorker.register("./sw.js");
	if (!navigator.serviceWorker.controller) {
		if (!sessionStorage.getItem("tw-sw-reload")) { sessionStorage.setItem("tw-sw-reload", "1"); location.reload(); await new Promise(() => {}); }
	}
}
if (!crossOriginIsolated) {
	status("This browser blocked the setup this game needs (cross-origin isolation). Reload the page; if it keeps happening, use desktop Chrome or Edge.");
	throw new Error("not cross-origin isolated");
}
sessionStorage.removeItem("tw-sw-reload");

// --- loading screen: elapsed time + tips (the #ad-slot element is free for an ad unit)
const t0 = performance.now();
setInterval(() => { $("load-time").textContent = `${Math.floor((performance.now() - t0) / 1000)} s`; }, 1000);
const tips = [
	"First start takes a minute or two: your browser is preparing the whole game.",
	"Everything runs on your device. Your game files never leave it.",
	"Worlds and characters are saved in this browser.",
	"Tip: bigger worlds take longer to create in the browser than on PC.",
];
let tip = 0;
$("load-tip").textContent = tips[0];
setInterval(() => { tip = (tip + 1) % tips.length; $("load-tip").textContent = tips[tip]; }, 7000);

async function dirFor(root, relPath, create) {
	let dir = root;
	for (const part of relPath.split("/").slice(0, -1)) dir = await dir.getDirectoryHandle(part, { create });
	return dir;
}

async function sizeOf(dir, name) {
	try { return (await (await dir.getFileHandle(name)).getFile()).size; } catch { return -1; }
}

// Copy files [{rel, size, open() -> ReadableStream}] into OPFS/<name>, skipping ones already there with the same size.
async function syncInto(name, files) {
	const opfs = await navigator.storage.getDirectory();
	await opfs.removeEntry("Cache", { recursive: true }).catch(() => {}); // loader caches depend on these files
	const top = await opfs.getDirectoryHandle(name, { create: true });
	let done = 0;
	for (const f of files) {
		const dir = await dirFor(top, f.rel, true);
		const fname = f.rel.split("/").pop();
		if (await sizeOf(dir, fname) !== f.size) {
			const w = await (await dir.getFileHandle(fname, { create: true })).createWritable();
			await (await f.open()).pipeTo(w);
		}
		if (++done % 50 === 0 || done === files.length) { status(`Copying ${name}: ${done} / ${files.length} files`); progress(done / files.length); }
	}
}

// Only what the browser needs from each install (same rules as tools/serve.py and tools/export-gamepack.sh).
const SKIP_TML = new Set(["dotnet", "tModPorter", "ILLogs", "tModLoader-Logs", "DedicatedServerUtils", "EmptySteamDepot", "LaunchUtils"]);

// <input webkitdirectory> rather than showDirectoryPicker: on Windows Chrome hides "dangerous" types (.dll) from the latter.
function filesFromInput(input, keep) {
	return [...input.files].map((file) => {
		const rel = file.webkitRelativePath.split("/").slice(1).join("/"); // drop the picked folder's own name
		return { rel, size: file.size, open: async () => file.stream() };
	}).filter((f) => keep(f.rel));
}

async function syncFromFolders(tmlInput, terrariaInput) {
	const tml = filesFromInput(tmlInput, (rel) => !SKIP_TML.has(rel.split("/")[0]));
	const content = filesFromInput(terrariaInput, (rel) => rel.startsWith("Content/"));
	if (!tml.some((f) => f.rel === "tModLoader.dll")) throw new Error("The first folder isn't tModLoader (no tModLoader.dll inside). Pick steamapps\\common\\tModLoader.");
	if (content.length === 0) throw new Error("The second folder isn't Terraria (no Content folder inside). Pick steamapps\\common\\Terraria.");
	await syncInto("tModLoader", tml);
	await syncInto("Terraria", content);
}

// Game pack: an uncompressed ustar archive made by tools/export-gamepack.sh from the player's own install.
// Streamed straight into OPFS (no 1 GB in memory).
async function syncFromGamePack(file) {
	const opfs = await navigator.storage.getDirectory();
	await opfs.removeEntry("Cache", { recursive: true }).catch(() => {});
	const reader = file.stream().getReader();
	let buf = new Uint8Array(0), consumed = 0, entries = 0;
	const more = async () => {
		const { value, done } = await reader.read();
		if (done) return false;
		const b = new Uint8Array(buf.length + value.length); b.set(buf); b.set(value, buf.length); buf = b;
		return true;
	};
	const take = (n) => { const out = buf.subarray(0, n); buf = buf.subarray(n); consumed += n; return out; };
	const str = (b) => new TextDecoder().decode(b).replace(/\0.*$/s, "");
	let sawTml = false;
	for (;;) {
		while (buf.length < 512) if (!(await more())) throw new Error("Game pack ended early (file incomplete?)");
		const h = take(512);
		if (h.every((x) => x === 0)) break; // end-of-archive marker
		const name = (str(h.subarray(345, 500)) ? str(h.subarray(345, 500)) + "/" : "") + str(h.subarray(0, 100));
		const size = parseInt(str(h.subarray(124, 136)).trim() || "0", 8);
		const type = String.fromCharCode(h[156] || 48);
		const padded = Math.ceil(size / 512) * 512;
		const top = name.split("/")[0];
		let writable = null;
		if (type === "0" && size >= 0 && (top === "tModLoader" || top === "Terraria")) {
			const rel = name.split("/").slice(1).join("/");
			if (top === "tModLoader" && rel === "tModLoader.dll") sawTml = true;
			const dir = await dirFor(await opfs.getDirectoryHandle(top, { create: true }), rel, true);
			const fname = rel.split("/").pop();
			if (await sizeOf(dir, fname) !== size) writable = await (await dir.getFileHandle(fname, { create: true })).createWritable();
		}
		let left = padded, body = size;
		while (left > 0) {
			if (buf.length === 0 && !(await more())) throw new Error("Game pack ended early (file incomplete?)");
			const chunk = take(Math.min(left, buf.length));
			const useful = chunk.subarray(0, Math.max(0, Math.min(chunk.length, body)));
			if (writable && useful.length) await writable.write(useful.slice());
			body -= useful.length; left -= chunk.length;
		}
		if (writable) await writable.close();
		if (++entries % 50 === 0) { status(`Unpacking game pack: ${entries} files`); progress(consumed / file.size); }
	}
	if (!sawTml) throw new Error("That file isn't a Terraria Web game pack (no tModLoader.dll inside).");
}

// Dev only: copy from the local dev server (tools/serve.py) instead of the pickers.
async function syncFromDevServer(name) {
	const list = (await (await fetch(`./dev-game/${name}/__list`)).text()).split("\n").filter(Boolean);
	await syncInto(name, list.map((line) => {
		const [size, rel] = line.split("\t");
		return { rel, size: Number(size), open: async () => (await fetch(`./dev-game/${name}/${rel.split("/").map(encodeURIComponent).join("/")}`)).body };
	}));
}

async function haveGame() {
	try {
		const opfs = await navigator.storage.getDirectory();
		await (await opfs.getDirectoryHandle("tModLoader")).getFileHandle("tModLoader.dll");
		await (await opfs.getDirectoryHandle("Terraria")).getDirectoryHandle("Content");
		return true;
	} catch { return false; }
}

async function runSetup() {
	const setup = $("setup");
	setup.hidden = false;
	const tmlInput = $("pick-tml"), terrariaInput = $("pick-terraria"), packInput = $("pick-pack"), go = $("go");
	const update = () => {
		$("tml-state").textContent = tmlInput.files.length ? `✓ ${tmlInput.files.length} files` : "";
		$("terraria-state").textContent = terrariaInput.files.length ? `✓ ${terrariaInput.files.length} files` : "";
		go.disabled = !(tmlInput.files.length && terrariaInput.files.length);
	};
	tmlInput.onchange = terrariaInput.onchange = update;
	await new Promise((resolve) => {
		const run = async (job) => {
			go.disabled = true; setup.hidden = true;
			try { await navigator.storage.persist?.(); await job(); resolve(); }
			catch (e) { setup.hidden = false; $("setup-error").textContent = e.message; update(); }
		};
		go.onclick = () => run(() => syncFromFolders(tmlInput, terrariaInput));
		packInput.onchange = () => packInput.files[0] && run(() => syncFromGamePack(packInput.files[0]));
	});
}

if (params.has("dev")) {
	await syncFromDevServer("tModLoader");
	await syncFromDevServer("Terraria");
} else if (!(await haveGame()) || params.has("reinstall")) {
	await runSetup();
}

status("Starting the engine...");
progress(null);
const { dotnet } = await import("./_framework/dotnet.js");
// ?jit: force the jiterpreter (the interpreter's run-time compiler for hot code) fully on; ?jitstats logs its stats.
const runtimeOptions = params.has("jit") ? ["--jiterpreter-traces-enabled", "--jiterpreter-interp-entry-enabled", "--jiterpreter-jit-call-enabled", "--jiterpreter-backward-branch-entries-enabled"] : [];
if (params.has("jitstats")) runtimeOptions.push("--jiterpreter-stats-enabled");
const runtime = await dotnet.withConfig({ runtimeOptions }).create();
const config = runtime.getConfig();
const exports = await runtime.getAssemblyExports(config.mainAssemblyName);
dotnet.instance.Module.canvas = $("canvas");
self.wasm = { Module: dotnet.instance.Module, dotnet, runtime, config, exports };

await runtime.runMain();
await exports.Program.PreInit();
status("Loading tModLoader (this is the slow part)...");
// Launch never resolves while the game runs: FNA hands the loop to the browser's frame loop.
exports.Program.Launch(params.get("args") ?? "").catch((e) => {
	status("The game crashed while starting: " + e.message + " (details in the browser console)");
	$("loading").classList.add("failed");
});
// Render at the window's real size (CSS pixels; the canvas is scaled crisply on high-DPI screens).
// Terraria's minimum window is 800x600.
let fitTimer;
// Terraria's minimum is 800x720; on smaller windows render a bit larger with the window's proportions and let
// the browser scale it down (never stretched).
const fitToWindow = () => {
	const w = Math.max(1, innerWidth), h = Math.max(1, innerHeight), s = Math.max(1, 800 / w, 720 / h);
	return exports.Program.Resize(Math.round(w * s), Math.round(h * s));
};
// Poll one at a time (calls queued while the game is busy would all arrive at once).
for (;;) {
	await new Promise((r) => setTimeout(r, 500));
	if (await exports.Program.IsReady()) {
		if (!params.has("noresize")) fitToWindow();
		addEventListener("resize", () => { clearTimeout(fitTimer); fitTimer = setTimeout(fitToWindow, 250); });
		$("loading").hidden = true;
		$("canvas").focus();
		watchBreaks();
		autoQuality();
		break;
	}
}

// While in a world, let the game lower its own settings if this device can't keep up (see Program.AutoTune).
function autoQuality() {
	if (params.has("noautotune")) return;
	let inWorldSince = 0; // frame rate always dips while a world finishes loading: give it 15 s
	setInterval(async () => {
		if (await exports.Program.GameState() !== "world") { inWorldSince = 0; return; }
		inWorldSince ||= performance.now();
		if (performance.now() - inWorldSince < 15000) return;
		const note = await exports.Program.AutoTune();
		if (note) toast(note);
	}, 5000);
}

function toast(text) {
	const t = $("toast");
	console.debug("[toast] " + text);
	t.textContent = text; t.hidden = false;
	clearTimeout(t._timer); t._timer = setTimeout(() => { t.hidden = true; }, 5000);
}

// Show the ad box while a world loads; hide it in menus and in the world (never over gameplay).
function watchBreaks() {
	if (!ADS_ENABLED) return;
	let last = "menu";
	setInterval(async () => {
		const state = await exports.Program.GameState();
		if (state === last) return;
		$("ad-break").hidden = state !== "loading";
		if (state === "loading") self.kaisrariaAdBreak?.("world-loading");
		last = state;
	}, 1000);
}
