#!/usr/bin/env bash
# Reconcile skill symlinks. Content lives in .agents/skills (public) or
# frontend/ee/.agents/skills (private); this script only manages links.
# Links are always relative; checks the working tree, so stage links after.
#   sync-skills.sh          fix drift
#   sync-skills.sh --check  report drift, exit 1 (pre-commit)
set -euo pipefail
shopt -s nullglob
cd "$(dirname "$0")/.."

# No symlink support (Windows without developer mode): links are text files, nothing to do.
[ "$(git config --get core.symlinks || true)" = false ] && exit 0

CHECK=${1:-}
DRIFT=0
EE=frontend/ee/.agents/skills
ROOT=.agents/skills
CLAUDE=.claude/skills

want() { # want <link> <target>
  if [ "$(readlink "$1" 2>/dev/null || true)" = "$2" ]; then return; fi
  if [ -e "$1" ] && [ ! -L "$1" ]; then
    echo "refusing: $1 exists and is not a link (name collision?)" >&2; exit 2
  fi
  DRIFT=1
  if [ "$CHECK" = "--check" ]; then echo "missing: $1 -> $2"; return; fi
  rm -f "$1"; ln -s "$2" "$1"; echo "linked:  $1 -> $2"
}

prune() { # prune <dir>: drop links whose immediate target is gone.
  # Target that is itself a (possibly dangling) link counts as present: on OSS
  # clones the whole chain hangs off an absent submodule and must survive.
  for l in "$1"/*; do
    [ -L "$l" ] || continue
    t="$1/$(readlink "$l")"
    if [ -e "$t" ] || [ -L "$t" ]; then continue; fi
    if [ ! -d "$EE" ]; then case "$(readlink "$l")" in *frontend/ee/*) continue;; esac; fi
    DRIFT=1
    if [ "$CHECK" = "--check" ]; then echo "dangling: $l"; else rm "$l"; echo "removed: $l"; fi
  done
}

mkdir -p "$ROOT" "$CLAUDE"

if [ -d "$EE" ]; then
  for d in "$EE"/*/; do
    n=$(basename "$d"); [ "$n" = _shared ] && continue
    want "$ROOT/$n" "../../$EE/$n"
  done
fi

prune "$ROOT"
for d in "$ROOT"/*; do
  [ -d "$d" ] || [ -L "$d" ] || continue
  n=$(basename "$d"); want "$CLAUDE/$n" "../../$ROOT/$n"
done
prune "$CLAUDE"

[ "$CHECK" = "--check" ] && [ $DRIFT = 1 ] && { echo "run scripts/sync-skills.sh"; exit 1; }
exit 0
