#include <emscripten/console.h>
#include <emscripten/wasmfs.h>
#include <emscripten/proxying.h>
#include <emscripten/threading.h>
#include <emscripten.h>
#include <assert.h>
#include <stdint.h>

int mount_opfs() {
	emscripten_console_log("mount_opfs: starting");
	backend_t opfs = wasmfs_create_opfs_backend();
	emscripten_console_log("mount_opfs: created opfs backend");
	int ret = wasmfs_create_directory("/libsdl", 0777, opfs);
	emscripten_console_log("mount_opfs: mounted opfs");
	return ret;
}


// needed because of upstream mono bug: https://github.com/dotnet/runtime/issues/112262
void *SDL_CreateWindow(char *title, int w, int h, uint64_t flags);
void *SDL__CreateWindow(char *title, int w, int h, unsigned int flags) {
	return SDL_CreateWindow(title, w, h, (uint64_t)flags);
}
uint64_t SDL_GetWindowFlags(void *window);
uint32_t SDL__GetWindowFlags(void *window) {
	return (uint32_t)SDL_GetWindowFlags(window);
}

// FNA's emscripten main loop: .NET 10 wasm doesn't resolve DllImport("__Native"), so FNA (patched) calls these.
// simulate_infinite_loop=1 unwinds the stack back to the browser, like a desktop Run() that never returns.
typedef void (*fna_loop_cb)(void);
void fna_set_main_loop(fna_loop_cb cb) { emscripten_set_main_loop(cb, 0, 1); }
void fna_cancel_main_loop(void) { emscripten_cancel_main_loop(); }
