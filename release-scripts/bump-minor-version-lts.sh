#!/usr/bin/env bash
set -euo pipefail

ROOT_VERSION_FILE="./.version"
SERVER_VERSION_FILE="./server/.version"
FRONTEND_VERSION_FILE="./frontend/.version"

# Read first line of root version file
version=$(head -n 1 "$ROOT_VERSION_FILE")

# Function to bump LTS version
bump_version() {
  local v="$1"
  if [[ "$v" == *"-lts" ]]; then
    base="${v%-lts}"
    IFS='.' read -r major minor patch <<< "$base"
    patch=$((patch + 1))
    echo "${major}.${minor}.${patch}-lts"
  else
    echo "$v"
  fi
}

new_version=$(bump_version "$version")

# Write version to a file (clear + version + newline)
write_version_file() {
  local file="$1"
  # Overwrite the file with version + single newline
  printf "%s\n" "$new_version" > "$file"
}

# Update all version files
for f in "$ROOT_VERSION_FILE" "$SERVER_VERSION_FILE" "$FRONTEND_VERSION_FILE"; do
  write_version_file "$f"
done

echo "Version updated to $new_version"
