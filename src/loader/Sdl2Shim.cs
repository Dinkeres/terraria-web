using System;
using S2 = SDL2.SDL;
using S3 = SDL3.SDL;

// tModLoader/ReLogic call SDL2 directly; the browser build of FNA only links SDL3.
// Patches.cs redirects every SDL2.SDL call in those assemblies to the method of the same name here.
public static class Sdl2Shim
{
    public static string SDL_GetError() => S3.SDL_GetError();
    public static string SDL_GetCurrentVideoDriver() => S3.SDL_GetCurrentVideoDriver();
    public static string SDL_GetCurrentAudioDriver() => S3.SDL_GetCurrentAudioDriver();
    public static int SDL_GetNumVideoDrivers() => S3.SDL_GetNumVideoDrivers();
    public static int SDL_GetNumAudioDrivers() => S3.SDL_GetNumAudioDrivers();
    public static string SDL_GetVideoDriver(int index) => S3.SDL_GetVideoDriver(index);
    public static string SDL_GetAudioDriver(int index) => S3.SDL_GetAudioDriver(index);
    public static int SDL_VideoInit(string driver) => 0; // FNA initializes SDL3 itself
    public static int SDL_GetNumVideoDisplays() => 1;

    public static int SDL_GetDisplayDPI(int display, out float ddpi, out float hdpi, out float vdpi)
    {
        ddpi = hdpi = vdpi = 96f; // never trigger tML's "high DPI" mode; the canvas handles scaling
        return 0;
    }

    public static int SDL_GetDisplayMode(int display, int modeIndex, out S2.SDL_DisplayMode mode)
    {
        mode = default;
        if (display != 0 || modeIndex != 0) return -1; // one display, one mode (callers loop until failure)
        // Terraria caps window sizes at the display mode; report a big one, the page sets the real size.
        mode.w = 3840; mode.h = 2160; mode.refresh_rate = 60;
        return 0;
    }

    public static void SDL_GetVersion(out S2.SDL_version v) { v = default; v.major = 2; v.minor = 30; }
    public static void SDL_VERSION(out S2.SDL_version v) => SDL_GetVersion(out v);

    public static S2.SDL_bool SDL_SetHintWithPriority(string name, string value, S2.SDL_HintPriority priority) =>
        S3.SDL_SetHintWithPriority(name, value, (S3.SDL_HintPriority)(int)priority) ? S2.SDL_bool.SDL_TRUE : S2.SDL_bool.SDL_FALSE;

    public static int SDL_ShowSimpleMessageBox(S2.SDL_MessageBoxFlags flags, string title, string message, IntPtr window)
    {
        Console.Error.WriteLine($"[MessageBox] {title}: {message}");
        return 0;
    }

    public static int SDL_ShowMessageBox(ref S2.SDL_MessageBoxData data, out int buttonid)
    {
        Console.Error.WriteLine($"[MessageBox] {data.title}: {data.message}");
        buttonid = -1;
        return 0;
    }

    // FNA knows the game window (SDL3 keyboard focus is unset in the browser).
    public static void SDL_StartTextInput() => Microsoft.Xna.Framework.Input.TextInputEXT.StartTextInput();

    public static string SDL_GetClipboardText() => S3.SDL_GetClipboardText();
    public static int SDL_SetClipboardText(string text) => S3.SDL_SetClipboardText(text) ? 0 : -1;
    public static void SDL_SetWindowTitle(IntPtr window, string title) => S3.SDL_SetWindowTitle(window, title);
    public static void SDL_SetWindowIcon(IntPtr window, IntPtr icon) { }
    public static IntPtr SDL_LoadBMP(string file) => IntPtr.Zero;
    public static S2.SDL_bool SDL_GetWindowWMInfo(IntPtr window, ref S2.SDL_SysWMinfo info) => S2.SDL_bool.SDL_FALSE;
}
