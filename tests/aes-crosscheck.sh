#!/usr/bin/env bash
# Checks src/loader/ManagedAes.cs against the real .NET AES (needs a desktop .NET 10 SDK; run in WSL).
set -euo pipefail
cd "$(dirname "$0")"
tmp=$(mktemp -d)
{ cat aes-crosscheck.head.cs; sed -n '/^public sealed class ManagedAes/,$p' ../src/loader/ManagedAes.cs; } > "$tmp/aestest.cs"
cd "$tmp" && dotnet run aestest.cs
