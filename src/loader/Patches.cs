using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.InteropServices;
using Mono.Cecil;
using Mono.Cecil.Cil;

// In-memory patches applied to the player's assemblies as they load. Each entry says why.
static class Patches
{
    public static readonly Dictionary<string, Action<ModuleDefinition>> ByAssembly = new()
    {
        ["tModLoader"] = m =>
        {
            Common(m);
            // Locals typed as sealed RijndaelManaged make the interpreter devirtualize calls onto ManagedAes; widen them.
            RetypeLocals(m, "System.Security.Cryptography.RijndaelManaged", typeof(System.Security.Cryptography.SymmetricAlgorithm));
            // Hashes steam_api / Terraria.exe to verify a Steam or GOG install; the browser has neither.
            // The player supplied their own files, which is our ownership model.
            Stub(m, "Terraria.ModLoader.Engine.InstallVerifier", ".cctor");
            Stub(m, "Terraria.ModLoader.Engine.InstallVerifier", "Startup");
            // MonoMod runtime detours can't run on browser Mono yet (OS kind Unknown). These only prettify
            // logs / set up the mod hook manager. TODO(mods): r58Playz/MonoMod wasm port.
            Stub(m, "Terraria.ModLoader.Engine.LoggingHooks", "Init");
            Stub(m, "Terraria.ModLoader.MonoModHooks", "Initialize");
            // new TcpClient() throws in browsers; Netplay's static ctor makes one even for single player.
            // TODO(co-op, stage 4): replace TcpSocket with a WebRTC-backed ISocket.
            StubCtor(m, "Terraria.Net.Sockets.TcpSocket");
            // Desktop warm-up: walks every type/method to pre-JIT them. Useless under the interpreter, slow, and it
            // touches Steamworks types (BadImageFormat here) and crashes. ForceLoadThread still sets LoadedEverything.
            Stub(m, "Terraria.Program", "ForceLoadAssembly");
            // Tries Steam's game-server API (no steam_api here); returning false pops a blocking error dialog.
            // Return true without setting SteamAvailable, so Steam features stay off quietly.
            Stub(m, "Terraria.Social.Steam.SteamedWraps", "TryInitViaGameServer", returnTrue: true);
        },
        ["ReLogic"] = m =>
        {
            Common(m);
            // The asset loader asserts Monitor.IsEntered(_requestLock). In the browser that check reports false
            // while the lock is held (seen on the main thread, interpreter and AOT alike), the assert throws and
            // the asset never loads (e.g. the player's body: only the hair was drawn). Shim says yes, logs once.
            RedirectCalls(m, (type, name) => (type, name) == ("System.Threading.Monitor", "IsEntered") ? typeof(Shim).GetMethod(nameof(Shim.MonitorIsEntered)) : null);
        },
    };

    static void Common(ModuleDefinition m)
    {
        var shim = typeof(Shim);
        RedirectCalls(m, (type, name) => (type, name) switch
        {
            // Patched assemblies load from memory, so Assembly.Location is ""; report the OPFS path instead.
            ("System.Reflection.Assembly", "get_Location") => shim.GetMethod(nameof(Shim.Location)),
            // The browser is an unknown OS to tModLoader/ReLogic ("Unknown OS"). Pretend to be Linux:
            // its code paths are the most generic (FNA, SDL, plain file paths).
            ("System.Runtime.InteropServices.RuntimeInformation", "IsOSPlatform") => shim.GetMethod(nameof(Shim.IsOSPlatform)),
            ("System.OperatingSystem", "IsWindows" or "IsMacOS") => shim.GetMethod(nameof(Shim.False)),
            ("System.OperatingSystem", "IsLinux") => shim.GetMethod(nameof(Shim.True)),
            // No OS processes in a browser. tML reads its own memory use for logs/UI: report the managed heap.
            ("System.Diagnostics.Process", "GetCurrentProcess") => shim.GetMethod(nameof(Shim.CurrentProcess)),
            ("System.Diagnostics.Process", "GetProcesses") => shim.GetMethod(nameof(Shim.NoProcesses)),
            ("System.Diagnostics.Process", "get_PrivateMemorySize64" or "get_WorkingSet64") => shim.GetMethod(nameof(Shim.ProcessMemory)),
            ("System.Diagnostics.Process", "Refresh") => shim.GetMethod(nameof(Shim.ProcessRefresh)),
            ("System.Diagnostics.Process", "get_Id") => shim.GetMethod(nameof(Shim.ProcessId)),
            // No synchronous AES in browser .NET; Terraria encrypts .plr/achievements with RijndaelManaged.
            ("System.Security.Cryptography.RijndaelManaged", ".ctor") => typeof(ManagedAes).GetMethod(nameof(ManagedAes.Create)),
            // Listing ~15k content files in OPFS takes tens of seconds at every start; cache listings of the
            // read-only game folders (see Shim.EnumerateFiles).
            ("System.IO.Directory", "EnumerateFiles") => shim.GetMethod(nameof(Shim.EnumerateFiles)),
            // Only SDL3 is linked in the browser build; see Sdl2Shim.
            ("SDL2.SDL", _) => typeof(Sdl2Shim).GetMethod(name)
                ?? throw new Exception($"patch: Sdl2Shim.{name} missing (add it)"),
            _ => null,
        });
    }

    static void Stub(ModuleDefinition m, string type, string method, bool returnTrue = false)
    {
        var t = m.GetType(type) ?? throw new Exception($"patch: type {type} not found");
        var ms = t.Methods.Where(x => x.Name == method && x.HasBody).ToList();
        if (ms.Count == 0) throw new Exception($"patch: {type}::{method} not found");
        foreach (var x in ms)
        {
            var b = x.Body;
            b.Instructions.Clear(); b.ExceptionHandlers.Clear(); b.Variables.Clear();
            var il = b.GetILProcessor();
            if (returnTrue) il.Emit(OpCodes.Ldc_I4_1);
            else if (x.ReturnType.MetadataType != MetadataType.Void)
            {
                var v = new VariableDefinition(x.ReturnType);
                b.Variables.Add(v); b.InitLocals = true;
                il.Emit(OpCodes.Ldloc, v);
            }
            il.Emit(OpCodes.Ret);
        }
    }

    static void RetypeLocals(ModuleDefinition m, string from, Type to)
    {
        var target = m.ImportReference(to);
        foreach (var t in m.GetTypes())
            foreach (var x in t.Methods.Where(x => x.HasBody))
                foreach (var v in x.Body.Variables)
                    if (v.VariableType.FullName == from) v.VariableType = target;
    }

    // Parameterless ctor -> only call object's ctor (fields stay default).
    static void StubCtor(ModuleDefinition m, string type)
    {
        var t = m.GetType(type) ?? throw new Exception($"patch: type {type} not found");
        var c = t.Methods.Single(x => x.IsConstructor && !x.IsStatic && !x.HasParameters);
        var b = c.Body;
        b.Instructions.Clear(); b.ExceptionHandlers.Clear(); b.Variables.Clear();
        var il = b.GetILProcessor();
        il.Emit(OpCodes.Ldarg_0);
        il.Emit(OpCodes.Call, m.ImportReference(typeof(object).GetConstructor(Type.EmptyTypes)));
        il.Emit(OpCodes.Ret);
    }

    // Debug aid (TW_TRACE=prefix1,prefix2): log the first calls into every method of types whose full name starts with a prefix.
    public static void Trace(ModuleDefinition m, string[] prefixes)
    {
        var trace = m.ImportReference(typeof(Shim).GetMethod(nameof(Shim.Trace)));
        foreach (var t in m.GetTypes())
        {
            if (!prefixes.Any(p => t.FullName.StartsWith(p))) continue;
            foreach (var x in t.Methods)
            {
                if (!x.HasBody) continue;
                var il = x.Body.GetILProcessor();
                var first = x.Body.Instructions[0];
                il.InsertBefore(first, il.Create(OpCodes.Ldstr, t.FullName + "::" + x.Name));
                // also log the first string argument, if any (e.g. a settings key)
                var sp = x.Parameters.FirstOrDefault(pp => pp.ParameterType.MetadataType == MetadataType.String);
                if (sp != null) il.InsertBefore(first, il.Create(OpCodes.Ldarg, sp)); else il.InsertBefore(first, il.Create(OpCodes.Ldnull));
                il.InsertBefore(first, il.Create(OpCodes.Call, trace));
            }
        }
    }

    // One pass over all IL: calls for which pick(declaringType, name) returns a method are redirected to it
    // (a static method taking the same arguments, with "this" first for instance calls).
    static void RedirectCalls(ModuleDefinition m, Func<string, string, System.Reflection.MethodInfo> pick)
    {
        var cache = new Dictionary<(string, string), MethodReference>();
        var counts = new Dictionary<string, int>();
        foreach (var t in m.GetTypes())
            foreach (var x in t.Methods)
            {
                if (!x.HasBody) continue;
                foreach (var ins in x.Body.Instructions)
                {
                    bool isCall = ins.OpCode == OpCodes.Call || ins.OpCode == OpCodes.Callvirt || ins.OpCode == OpCodes.Newobj; // newobj -> static factory
                    if ((!isCall && ins.OpCode != OpCodes.Ldftn) || ins.Operand is not MethodReference r) continue;
                    var key = (r.DeclaringType.FullName, r.Name);
                    if (!cache.TryGetValue(key, out var target))
                        cache[key] = target = pick(key.Item1, key.Item2) is { } mi ? m.ImportReference(mi) : null;
                    if (target == null) continue;
                    // only the overload with the same arguments (+ "this" for instance calls)
                    if (target.Parameters.Count != r.Parameters.Count + (r.HasThis && ins.OpCode != OpCodes.Newobj ? 1 : 0)) continue;
                    if (isCall) ins.OpCode = OpCodes.Call; // ldftn (method group -> delegate) keeps its opcode
                    ins.Operand = target;
                    counts[key.Item1 + "." + key.Item2] = counts.GetValueOrDefault(key.Item1 + "." + key.Item2) + 1;
                }
            }
        Console.WriteLine($"patch {m.Assembly.Name.Name}: " + string.Join(", ", counts.Select(kv => $"{kv.Key} x{kv.Value}")));
    }
}

// Replacements called by patched game code. Must stay public.
public static class Shim
{
    public static bool IsOSPlatform(OSPlatform p) => p == OSPlatform.Linux;
    public static readonly System.Collections.Concurrent.ConcurrentDictionary<System.Reflection.Assembly, string> Paths = new();
    public static string Location(System.Reflection.Assembly a) => Paths.TryGetValue(a, out var p) ? p : a.Location;
    public static bool True() => true;
    static int monitorWarned;
    public static bool MonitorIsEntered(object o)
    {
        if (!System.Threading.Monitor.IsEntered(o) && System.Threading.Interlocked.Exchange(ref monitorWarned, 1) == 0)
            Console.WriteLine($"[shim] Monitor.IsEntered said false on thread {Environment.CurrentManagedThreadId} ({System.Threading.Thread.CurrentThread.Name}); treating as held");
        return true;
    }

    // Same overload as Directory.EnumerateFiles(string, string, SearchOption). Cached only for the game install
    // folders (immutable until the player re-copies them); saves, mods and config are always listed live.
    public static IEnumerable<string> EnumerateFiles(string path, string pattern, System.IO.SearchOption option)
    {
        var full = System.IO.Path.GetFullPath(path);
        if (!full.StartsWith("/tModLoader/") && !full.StartsWith("/Terraria/"))
            return System.IO.Directory.EnumerateFiles(path, pattern, option);
        var key = Convert.ToHexString(System.Security.Cryptography.SHA256.HashData(System.Text.Encoding.UTF8.GetBytes($"{full}|{pattern}|{option}")))[..16];
        var file = $"{Program.CacheDir}/dir-{key}.txt";
        if (System.IO.File.Exists(file))
        {
            // stored relative to 'full'; rebuild with the caller's spelling of 'path'
            return System.IO.File.ReadAllLines(file).Select(rel => System.IO.Path.Combine(path, rel)).ToArray();
        }
        var list = System.IO.Directory.EnumerateFiles(path, pattern, option).ToArray();
        System.IO.Directory.CreateDirectory(Program.CacheDir);
        System.IO.File.WriteAllLines(file, list.Select(p => System.IO.Path.GetRelativePath(path, p)));
        return list;
    }
    public static System.Diagnostics.Process CurrentProcess() => null; // only used with the shims below
    public static System.Diagnostics.Process[] NoProcesses() => Array.Empty<System.Diagnostics.Process>();
    public static long ProcessMemory(System.Diagnostics.Process p) => GC.GetTotalMemory(false);
    public static void ProcessRefresh(System.Diagnostics.Process p) { }
    public static int ProcessId(System.Diagnostics.Process p) => 1;
    static readonly System.Collections.Concurrent.ConcurrentDictionary<string, int> traceCounts = new();
    static volatile string traceLast; static long traceTotal; static System.Threading.Timer traceTimer;
    public static void Trace(string method, string arg) { if (arg != null) method += "(" + arg + ")"; traceLast = method; System.Threading.Interlocked.Increment(ref traceTotal);
        traceTimer ??= new System.Threading.Timer(_ => Console.WriteLine($"[trace watchdog] last={traceLast} total={traceTotal}"), null, 5000, 5000);
        if (traceCounts.AddOrUpdate(method, 1, (_, n) => n + 1) <= 3) Console.WriteLine($"[trace t{Environment.CurrentManagedThreadId}] {method}"); }
    public static bool False() => false;
}
