#!/usr/bin/env bash
# Build the loader inside WSL (native Linux disk is much faster than /mnt/c).
# Usage (from Windows): wsl -e bash tools/build.sh
set -euo pipefail
export PATH=$HOME/.dotnet:$PATH DOTNET_CLI_TELEMETRY_OPTOUT=1
REPO="$(cd "$(dirname "$0")/.." && pwd)"
OUT=${TW_BUILD_DIR:-$HOME/tw/loader}   # TW_BUILD_DIR: build elsewhere (e.g. an AOT experiment)
mkdir -p "$OUT"
rsync -a --delete --exclude bin --exclude obj --exclude FNA --exclude statics "$REPO/src/loader/" "$OUT/"
cd "$OUT"
rm -rf bin/Release/net10.0/publish  # drop stale hashed files from earlier builds
make build PUBLISH_ARGS="${TW_AOT:+-p:TwAot=true}"   # TW_AOT=1: ahead-of-time compile (slow build, faster game)
