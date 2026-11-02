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

// Dev only: copy from the local dev server (tools/serve.py) instead of the folder picker.
async function syncFromDevServer(name) {
	const opfs = await navigator.storage.getDirectory();
	const top = await opfs.getDirectoryHandle(name, { create: true });
	const list = (await (await fetch(`/dev-game/${name}/__list`)).text()).split("\n").filter(Boolean);
	let done = 0, copied = 0;
	for (const line of list) {
		const [size, rel] = line.split("\t");
		const dir = await dirFor(top, rel, true);
		const fname = rel.split("/").pop();
		let have = -1;
		try { have = (await (await dir.getFileHandle(fname)).getFile()).size; } catch { }
		if (have !== Number(size)) {
			const res = await fetch(`/dev-game/${name}/${rel.split("/").map(encodeURIComponent).join("/")}`);
			const w = await (await dir.getFileHandle(fname, { create: true })).createWritable();
			await res.body.pipeTo(w);
			copied++;
		}
		if (++done % 200 === 0) status(`Copying ${name}: ${done}/${list.length}`);
	}
	console.debug(`${name}: ${list.length} files, ${copied} copied`);
}

if (params.has("dev")) {
	await syncFromDevServer("tModLoader");
	await syncFromDevServer("Terraria");
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
