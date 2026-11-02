#!/usr/bin/env bash
# Pack YOUR OWN tModLoader + Terraria files into one .tar for your own other devices (Chromebook etc.),
# loaded via "Load a game pack" on the setup screen. Never upload or share this file: it is the game.
# Leaves out logs, crash reports, server tools and Windows/Linux native binaries (none are needed and logs
# can contain your username/paths). Usage (WSL): bash tools/export-gamepack.sh <steamapps/common dir> <out.tar>
set -euo pipefail
COMMON="${1:-/mnt/s/SteamLibrary/steamapps/common}"
OUT="${2:-/mnt/c/Users/$USER/Downloads/terraria-web-gamepack.tar}"
cd "$COMMON"
tar --format=ustar --owner=0 --group=0 --numeric-owner --mtime='2020-01-01' -cf "$OUT" \
  --exclude='tModLoader/dotnet' --exclude='tModLoader/tModPorter' --exclude='tModLoader/ILLogs' \
  --exclude='tModLoader/tModLoader-Logs' --exclude='tModLoader/DedicatedServerUtils' \
  --exclude='tModLoader/EmptySteamDepot' --exclude='tModLoader/LaunchUtils' \
  --exclude='tModLoader/Libraries/Native' --exclude='*crashlog*' --exclude='*.log' \
  tModLoader Terraria/Content
echo "wrote $OUT ($(du -h "$OUT" | cut -f1)); entries: $(tar -tf "$OUT" | wc -l)"
if tar -xOf "$OUT" | grep -a -i -q -E "luvro|C:\\Users\\\\"; then echo "WARNING: personal-looking text found inside"; else echo "personal-info check: clean"; fi
