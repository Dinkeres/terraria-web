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
        },
        ["ReLogic"] = Common,
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
            // Only SDL3 is linked in the browser build; see Sdl2Shim.
            ("SDL2.SDL", _) => typeof(Sdl2Shim).GetMethod(name)
                ?? throw new Exception($"patch: Sdl2Shim.{name} missing (add it)"),
            _ => null,
        });
    }

    static void Stub(ModuleDefinition m, string type, string method)
    {
        var t = m.GetType(type) ?? throw new Exception($"patch: type {type} not found");
        var ms = t.Methods.Where(x => x.Name == method && x.HasBody).ToList();
        if (ms.Count == 0) throw new Exception($"patch: {type}::{method} not found");
        foreach (var x in ms)
        {
            var b = x.Body;
            b.Instructions.Clear(); b.ExceptionHandlers.Clear(); b.Variables.Clear();
            var il = b.GetILProcessor();
            if (x.ReturnType.MetadataType != MetadataType.Void)
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
