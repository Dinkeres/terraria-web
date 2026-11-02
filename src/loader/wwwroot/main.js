// Terraria Web loader page.
// Game files live in OPFS (browser storage), which C# sees at /libsdl:
//   /libsdl/tModLoader/...        the player's tModLoader install
//   /libsdl/Terraria/Content/...  the player's vanilla Terraria content
const status = (t) => { const s = document.getElementById("status"); if (s) s.textContent = t; console.debug("[status] " + t); };
const params = new URLSearchParams(location.search);

async function dirFor(root, relPath, create) {
	let dir = root;
	for (const part of relPath.split("/").slice(0, -1)) dir = await dir.getDirectoryHandle(part, { create });
	return dir;
}

// Copy files [{rel, size, open() -> ReadableStream}] into OPFS/<name>, skipping ones already there with the same size.
async function syncInto(name, files) {
	const opfs = await navigator.storage.getDirectory();
	const top = await opfs.getDirectoryHandle(name, { create: true });
	let done = 0, copied = 0;
	for (const f of files) {
		const dir = await dirFor(top, f.rel, true);
		const fname = f.rel.split("/").pop();
		let have = -1;
		try { have = (await (await dir.getFileHandle(fname)).getFile()).size; } catch { }
		if (have !== f.size) {
			const w = await (await dir.getFileHandle(fname, { create: true })).createWritable();
			await (await f.open()).pipeTo(w);
			copied++;
		}
		if (++done % 100 === 0 || done === files.length) status(`Copying ${name}: ${done} / ${files.length} files`);
	}
	console.debug(`${name}: ${files.length} files, ${copied} copied`);
}

// Only what the browser needs from each install (same rules as tools/serve.py).
const SKIP_TML = new Set(["dotnet", "tModPorter", "ILLogs", "tModLoader-Logs", "DedicatedServerUtils", "EmptySteamDepot", "LaunchUtils"]);

async function listHandle(dirHandle, prefix = "", out = []) {
	for await (const [n, h] of dirHandle.entries()) {
		const rel = prefix + n;
		if (h.kind === "directory") await listHandle(h, rel + "/", out);
		else { const file = await h.getFile(); out.push({ rel, size: file.size, open: async () => file.stream() }); }
	}
	return out;
}

// The player picks their Steam "common" folder (it holds both tModLoader and Terraria).
async function syncFromPicker() {
	const common = await showDirectoryPicker({ id: "steam-common", mode: "read" });
	let tml, terraria;
	try { tml = await common.getDirectoryHandle("tModLoader"); terraria = await common.getDirectoryHandle("Terraria"); }
	catch { throw new Error(`"${common.name}" doesn't contain both tModLoader and Terraria. Pick steamapps\\common.`); }
	const tmlFiles = [];
	for await (const [n, h] of tml.entries()) {
		if (SKIP_TML.has(n)) continue;
		if (h.kind === "directory") await listHandle(h, n + "/", tmlFiles);
		else { const file = await h.getFile(); tmlFiles.push({ rel: n, size: file.size, open: async () => file.stream() }); }
	}
	await syncInto("tModLoader", tmlFiles);
	await syncInto("Terraria", await listHandle(await terraria.getDirectoryHandle("Content"), "Content/"));
	localStorage.setItem("tw-installed", "1");
}

// Dev only: copy from the local dev server (tools/serve.py) instead of the folder picker.
async function syncFromDevServer(name) {
	const list = (await (await fetch(`/dev-game/${name}/__list`)).text()).split("\n").filter(Boolean);
	await syncInto(name, list.map((line) => {
		const [size, rel] = line.split("\t");
		return { rel, size: Number(size), open: async () => (await fetch(`/dev-game/${name}/${rel.split("/").map(encodeURIComponent).join("/")}`)).body };
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

if (params.has("dev")) {
	await syncFromDevServer("tModLoader");
	await syncFromDevServer("Terraria");
} else if (!(await haveGame()) || params.has("reinstall")) {
	const setup = document.getElementById("setup");
	setup.hidden = false;
	status("");
	await new Promise((resolve) => {
		document.getElementById("pick").onclick = async () => {
			try { await syncFromPicker(); setup.hidden = true; resolve(); }
			catch (e) { status(e.message); }
		};
	});
}

status("Starting .NET...");
const { dotnet } = await import("/_framework/dotnet.js");
const runtime = await dotnet.withConfig({}).create();
const config = runtime.getConfig();
const exports = await runtime.getAssemblyExports(config.mainAssemblyName);
dotnet.instance.Module.canvas = document.getElementById("canvas");
self.wasm = { Module: dotnet.instance.Module, dotnet, runtime, config, exports };

await runtime.runMain();
await exports.Program.PreInit();
status("Launching tModLoader...");
setTimeout(() => document.getElementById("status")?.remove(), 1000);
// Never resolves while the game runs: FNA hands the loop to the browser's frame loop.
await exports.Program.Launch(params.get("args") ?? "");
