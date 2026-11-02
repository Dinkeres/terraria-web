#!/usr/bin/env bash
# Build the loader inside WSL (native Linux disk is much faster than /mnt/c).
# Usage (from Windows): wsl -e bash tools/build.sh
set -euo pipefail
export PATH=$HOME/.dotnet:$PATH DOTNET_CLI_TELEMETRY_OPTOUT=1
REPO="$(cd "$(dirname "$0")/.." && pwd)"
OUT=$HOME/tw/loader
mkdir -p "$OUT"
rsync -a --delete --exclude bin --exclude obj --exclude FNA --exclude statics "$REPO/src/loader/" "$OUT/"
cd "$OUT"
make build
