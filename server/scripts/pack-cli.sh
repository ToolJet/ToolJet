#!/usr/bin/env bash
# Packs the ToolJet CLI (cli/) into server/code-mode-cli/tooljet-cli.tgz, which the server serves at
# GET /api/code-mode/cli/tooljet-cli.tgz (ee/code-mode-source/cli.controller.ts), so `npm i -g <that URL>` installs the
# CLI built with this server. The Docker images run it after building cli/ for the built-in packs; in a checkout run
# it from anywhere once cli/ has its dependencies (npm --prefix cli ci --include=dev).
#
# It builds cli/ when cli/dist is missing, writes oclif.manifest.json for the pack and removes it again, and packs
# without lifecycle scripts, so README.md (which `prepack` rewrites) is left as it is.
#
# custom-component-sdk.tgz beside it (GET /api/code-mode/cli/custom-component-sdk.tgz) comes from the private SDK repo,
# which ee-preview.Dockerfile builds. In a checkout, from the SDK's folder once it is built:
#   mv "$(npm pack --ignore-scripts --silent --pack-destination <server>/code-mode-cli | tail -n 1 | sed 's|^|<server>/code-mode-cli/|')" <server>/code-mode-cli/custom-component-sdk.tgz
set -euo pipefail

root="$(cd "$(dirname "$0")/../.." && pwd)"
cli="$root/cli"
out="$root/server/code-mode-cli"

[ -d "$cli/dist" ] || npm --prefix "$cli" run build
mkdir -p "$out"
(
  cd "$cli"
  npx --no-install oclif manifest >/dev/null
  trap 'rm -f oclif.manifest.json' EXIT
  name="$(npm pack --ignore-scripts --silent --pack-destination "$out" | tail -n 1)"
  mv -f "$out/$name" "$out/tooljet-cli.tgz"
)
echo "Packed $(node -p "require('$cli/package.json').version") into $out/tooljet-cli.tgz"
