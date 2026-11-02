#!/usr/bin/env bash
# Publish the built site to the gh-pages branch (GitHub Pages). Run from Git Bash on Windows after
# `wsl -e bash tools/build.sh`. Contains only our loader, FNA and the .NET runtime: no game files.
set -euo pipefail
REPO="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${TMPDIR:-/tmp}/terraria-web-pages"
rm -rf "$OUT" && mkdir -p "$OUT"
MSYS_NO_PATHCONV=1 wsl -e bash -c "cp -r ~/tw/loader/bin/Release/net10.0/publish/wwwroot/. '$(cygpath -w "$OUT" | sed 's#\#/#g; s#^\([A-Za-z]\):#/mnt/\L\1#')/'"
touch "$OUT/.nojekyll"   # serve _framework/ as-is
# safety: refuse to publish anything that looks like game data
if find "$OUT" \( -iname '*.xnb' -o -iname '*.xwb' -o -iname 'tModLoader.dll' -o -iname 'Terraria.exe' -o -iname '*.tar' \) | grep -q .; then
  echo "refusing: game files found in site output" >&2; exit 1
fi
cd "$OUT"
git init -q -b gh-pages
git add -A
git -c user.name="Dinkeres" -c user.email="p67v62cf8f@privaterelay.appleid.com" commit -q -m "Deploy $(git -C "$REPO" rev-parse --short HEAD)"
git push -q -f "$(git -C "$REPO" remote get-url origin)" gh-pages
echo "pushed $(du -sh . | cut -f1) to gh-pages"
