using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Runtime.InteropServices.JavaScript;
using System.Runtime.Loader;
using System.Threading.Tasks;
using Mono.Cecil;
using Mono.Cecil.Cil;

[assembly: System.Runtime.Versioning.SupportedOSPlatform("browser")]

// Loads the player's own tModLoader from OPFS (/libsdl) and runs its unmodified launcher.
// Desktop-only bits are patched in memory with Cecil (see Patches.cs); nothing is written back.
partial class Program
{
    const string Root = "/libsdl";
    // WASMFS getcwd() drops the /libsdl mount prefix, so game paths live at /tModLoader and /Terraria
    // (symlinks into OPFS); that keeps relative paths like ../Terraria/Content working.
    const string TmlDir = "/tModLoader";

    private static void Main() => Console.WriteLine("Terraria Web loader ready");

    [DllImport("Emscripten")]
    public extern static int mount_opfs();

    [JSExport]
    internal static Task PreInit() => Task.Run(() =>
    {
        if (mount_opfs() != 0) throw new Exception("Failed to mount OPFS");
        foreach (var dir in new[] { "tModLoader", "Terraria" })
            if (!Directory.Exists("/" + dir)) Directory.CreateSymbolicLink("/" + dir, Root + "/" + dir);
        // Saves (players, worlds, config, mods) go to Terraria's Linux save dir; point it into OPFS so they persist.
        Directory.CreateDirectory(Root + "/Saves");
        Directory.CreateDirectory("/home/web_user/.local/share");
        if (!Directory.Exists("/home/web_user/.local/share/Terraria"))
            Directory.CreateSymbolicLink("/home/web_user/.local/share/Terraria", Root + "/Saves");
        Environment.SetEnvironmentVariable("FNA_PLATFORM_BACKEND", "SDL3");
    });

    static Dictionary<string, string> libraryIndex;
    static Type terrariaMain;

    // Polled by the loading screen: true once Terraria has finished its own splash/loading.
    [JSExport]
    internal static Task<bool> IsReady() => Task.FromResult(
        terrariaMain?.GetField("showSplash", BindingFlags.Static | BindingFlags.Public)?.GetValue(null) is false);
    static RefResolver resolver;

    [JSExport]
    internal static Task Launch(string args)
    {
        try
        {
            Directory.SetCurrentDirectory(TmlDir);
            // Loader-only option: -trace=Prefix1,Prefix2 (see Patches.Trace)
            foreach (var a in args.Split(' ').Where(a => a.StartsWith("-trace=")))
                Environment.SetEnvironmentVariable("TW_TRACE", a["-trace=".Length..]);
            args = string.Join(' ', args.Split(' ').Where(a => !a.StartsWith("-trace=")));
            IndexLibraries();
            if (args.Contains("-fsbench")) { var sw = System.Diagnostics.Stopwatch.StartNew(); int n = 0; foreach (var f in Directory.EnumerateFiles("../Terraria/Content/Images", "*.xnb", SearchOption.AllDirectories)) if (++n % 1000 == 0) Console.WriteLine($"fsbench {n} files {sw.ElapsedMilliseconds} ms"); Console.WriteLine($"fsbench done {n} files {sw.ElapsedMilliseconds} ms"); }
            resolver = new RefResolver();
            foreach (var dir in libraryIndex.Values.Select(Path.GetDirectoryName).Distinct())
                resolver.AddSearchDirectory(dir);
            resolver.AddSearchDirectory(TmlDir);
            if (args.Contains("-loadtest")) LoadTest(libraryIndex["Steamworks.NET"]);

            AssemblyLoadContext.Default.Resolving += (ctx, name) =>
                libraryIndex.TryGetValue(name.Name, out var path) ? Load(path) : null;

            var tml = Load(TmlDir + "/tModLoader.dll");
            terrariaMain = tml.GetType("Terraria.Main");
            var main = tml.GetType("Terraria.MonoLaunch", true)
                .GetMethod("Main", BindingFlags.Static | BindingFlags.NonPublic | BindingFlags.Public);
            var argv = args.Split(' ', StringSplitOptions.RemoveEmptyEntries);
            Console.WriteLine($"Calling MonoLaunch.Main({string.Join(" ", argv)}) on {RuntimeInformation.FrameworkDescription}");
            // On success this never returns: FNA's Game.Run() unwinds into the browser frame loop.
            // Desktop main threads have no SynchronizationContext. The browser one would capture async continuations
            // back onto this thread, which deadlocks when the game blocks on a Task (e.g. .Wait()).
            System.Threading.SynchronizationContext.SetSynchronizationContext(null);
            if (argv.Contains("-watch")) WatchGameState(tml);
            if (argv.Contains("-watch")) AppDomain.CurrentDomain.FirstChanceException += (_, e) =>
            {
                if (e.Exception is not NullReferenceException) return;
                var frames = new System.Diagnostics.StackTrace(e.Exception).GetFrames().Take(3);
                Console.WriteLine("[nre] " + string.Join(" <- ", frames.Select(f => $"{f.GetMethod()?.DeclaringType?.Name}.{f.GetMethod()?.Name}@IL_{f.GetILOffset():x4}")));
            };
            main.Invoke(null, new object[] { argv });
            Console.WriteLine("MonoLaunch.Main returned (game exited)");
        }
        catch (Exception e)
        {
            Console.Error.WriteLine("Launch failed:\n" + (e is TargetInvocationException t ? t.InnerException : e));
            return Task.FromException(e);
        }
        return Task.CompletedTask;
    }

    static void IndexLibraries()
    {
        libraryIndex = new(StringComparer.OrdinalIgnoreCase);
        // Like the desktop host's deps.json resolution for a Linux RID: runtimes/linux/lib/* beats lib/*
        // (some lib/ copies, e.g. Steamworks.NET, are reference assemblies that can't execute).
        var all = Directory.EnumerateFiles(TmlDir + "/Libraries", "*.dll", SearchOption.AllDirectories)
            .Where(p => !p.Contains("/Native/") && (!p.Contains("/runtimes/") || p.Contains("/runtimes/linux/lib/")))
            .OrderBy(p => p.Contains("/runtimes/linux/lib/") ? 0 : 1);
        foreach (var path in all)
        {
            var name = Path.GetFileNameWithoutExtension(path);
            if (name == "FNA") continue; // ours (browser build) is already loaded
            libraryIndex.TryAdd(name, path);
        }
        Console.WriteLine($"Indexed {libraryIndex.Count} libraries");
    }

    static Assembly Load(string path)
    {
        var name = Path.GetFileNameWithoutExtension(path);
        var traced = (Environment.GetEnvironmentVariable("TW_TRACE") ?? "").Split(',').Any(p => p.Length > 0 && name.StartsWith(p.Split('.')[0]));
        if (!Patches.ByAssembly.TryGetValue(name, out var patch) && !traced)
            return AssemblyLoadContext.Default.LoadFromAssemblyPath(path);
        patch ??= _ => { };

        var sw = System.Diagnostics.Stopwatch.StartNew();
        using var module = ModuleDefinition.ReadModule(path, new ReaderParameters { AssemblyResolver = resolver, InMemory = true });
        patch(module);
        if (Environment.GetEnvironmentVariable("TW_TRACE") is { Length: > 0 } trace) Patches.Trace(module, trace.Split(','));
        using var ms = new MemoryStream();
        module.Write(ms);
        Console.WriteLine($"Patched {name} in {sw.ElapsedMilliseconds} ms");
        ms.Position = 0;
        var asm = AssemblyLoadContext.Default.LoadFromStream(ms);
        Shim.Paths[asm] = path;
        return asm;
    }

    // Cecil needs the .NET reference assemblies to write modules; in the browser they aren't files.
    // The player's tModLoader ships them as resources of Basic.Reference.Assemblies.Net80.dll.
    sealed class RefResolver : DefaultAssemblyResolver
    {
        Assembly refs;
        public override AssemblyDefinition Resolve(AssemblyNameReference name, ReaderParameters parameters)
        {
            try { return base.Resolve(name, parameters); }
            catch (AssemblyResolutionException)
            {
                refs ??= AssemblyLoadContext.Default.LoadFromAssemblyPath(libraryIndex["Basic.Reference.Assemblies.Net80"]);
                var s = refs.GetManifestResourceStream("net80." + name.Name);
                if (s == null) throw;
                parameters ??= new ReaderParameters();
                parameters.AssemblyResolver = this;
                var def = AssemblyDefinition.ReadAssembly(s, parameters);
                RegisterAssembly(def);
                return def;
            }
        }
    }

    // Debug: find which feature of an assembly browser Mono rejects (BadImageFormat).
    static void LoadTest(string path)
    {
        var variants = new (string, Action<ModuleDefinition>)[]
        {
            ("list", m => Console.WriteLine("loadtest asm attrs: " + string.Join(", ", m.Assembly.CustomAttributes.Select(c => c.AttributeType.FullName)) + " | module: " + string.Join(", ", m.CustomAttributes.Select(c => c.AttributeType.FullName)))),
            ("no-asm-attrs", m => { m.Assembly.CustomAttributes.Clear(); m.CustomAttributes.Clear(); }),
            ("no-custom-attrs", m => { m.Assembly.CustomAttributes.Clear(); m.CustomAttributes.Clear(); foreach (var t in m.GetTypes()) { t.CustomAttributes.Clear(); foreach (var x in t.Methods) { x.CustomAttributes.Clear(); foreach (var pa in x.Parameters) pa.CustomAttributes.Clear(); x.MethodReturnType.CustomAttributes.Clear(); } foreach (var f in t.Fields) f.CustomAttributes.Clear(); foreach (var pr in t.Properties) pr.CustomAttributes.Clear(); } }),
            ("no-pinvoke", m => { foreach (var t in m.GetTypes()) foreach (var x in t.Methods) if (x.IsPInvokeImpl) { x.IsPInvokeImpl = false; x.PInvokeInfo = null; x.IsPreserveSig = false; x.ImplAttributes = Mono.Cecil.MethodImplAttributes.IL; x.Body = new Mono.Cecil.Cil.MethodBody(x); x.Body.GetILProcessor().Emit(OpCodes.Ldnull); x.Body.GetILProcessor().Emit(OpCodes.Throw); } }),
            ("no-resources", m => m.Resources.Clear()),
            ("no-modulerefs-fnptr", m => { foreach (var t in m.GetTypes()) foreach (var x in t.Methods.ToList()) if (x.Parameters.Any(pa => pa.ParameterType.IsFunctionPointer) || x.ReturnType.IsFunctionPointer) t.Methods.Remove(x); }),
        };
        foreach (var (name, change) in variants)
        {
            try
            {
                using var module = ModuleDefinition.ReadModule(path, new ReaderParameters { AssemblyResolver = resolver, InMemory = true });
                change(module);
                var ms = new MemoryStream(); module.Write(ms); ms.Position = 0;
                var a = new AssemblyLoadContext(name, true).LoadFromStream(ms);
                Console.WriteLine($"loadtest {name}: OK types={a.GetTypes().Length}");
            }
            catch (Exception e) { Console.WriteLine($"loadtest {name}: FAIL {e.GetType().Name} {e.Message}"); }
        }
    }

    // Debug (-watch): print a few of Terraria's static input/menu fields every second.
    static void WatchGameState(Assembly tml)
    {
        var main = tml.GetType("Terraria.Main");
        string[] names = { "mouseX", "mouseY", "mouseLeft", "mouseLeftRelease", "menuMode", "hasFocus", "focusMenu", "selectedMenu", "gameMenu", "screenWidth", "screenHeight", "GameUpdateCount", "_isAsyncLoadComplete", "showSplash", "updatesCountedForFPS", "drawsCountedForFPS" };
        new System.Threading.Thread(() =>
        {
            while (true)
            {
                System.Threading.Thread.Sleep(1000);
                try { var prog = tml.GetType("Terraria.Program"); Console.WriteLine("[watch] LoadedEverything=" + prog.GetField("LoadedEverything", BindingFlags.Static | BindingFlags.Public | BindingFlags.NonPublic)?.GetValue(null) + " LoadedPercentage=" + prog.GetField("LoadedPercentage", BindingFlags.Static | BindingFlags.Public | BindingFlags.NonPublic)?.GetValue(null) + " " + string.Join(" ", names.Select(n => n + "=" + main.GetField(n, BindingFlags.Static | BindingFlags.Public | BindingFlags.NonPublic)?.GetValue(null)))); }
                catch (Exception e) { Console.WriteLine("[watch] " + e.Message); }
            }
        }) { IsBackground = true }.Start();
    }
}
