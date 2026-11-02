#!/bin/bash
# secret-check.sh <video.mp4>...  — one frame per 2s, on-device OCR (macOS Vision), grep for secret-like text.
# Prints only matching lines (with frame), never the full OCR dump. Review every hit by eye.
set -euo pipefail
HERE=$(cd "$(dirname "$0")" && pwd); W=${TMPDIR:-/tmp}/secret-check.$$; mkdir -p "$W"
[ -x "$W/ocr" ] || swiftc -O "$HERE/ocr.swift" -o "$W/ocr" 2>/dev/null
n=0
for v in "$@"; do b=$(basename "$v" .mp4); mkdir -p "$W/$b"; ffmpeg -loglevel error -y -i "$v" -vf fps=1/2 "$W/$b/f%03d.png"; n=$((n + $(ls "$W/$b" | wc -l))); done
"$W/ocr" $(find "$W" -name '*.png' | sort) > "$W/ocr.txt"
echo "frames: $n"
awk '/^### /{n=split($2,a,"/"); f=a[n-1]"/"a[n]; next} {print f": "$0}' "$W/ocr.txt" \
  | grep -i -E 'secret|token|passw|licen[cs]e.?key|bearer|sk-[a-z0-9]|eyJ[a-zA-Z0-9]|api.?key|PG_PASS|=[A-Za-z0-9+/]{16,}|[A-Za-z0-9+/]{40,}' \
  | grep -v -i -E 'Tokens used|LLM key$' || echo "no secret-like text"
rm -rf "$W"
