#!/usr/bin/env bash
set -euo pipefail

ROOT_VERSION_FILE="./.version"
SERVER_VERSION_FILE="./server/.version"
FRONTEND_VERSION_FILE="./frontend/.version"

# Optional first argument: pass "--create-branch" to create a branch,
# commit the bumped version files and open a PR back to the source branch.
CREATE_BRANCH_FLAG="--create-branch"
ARG="${1:-}"

# Read first line of root version file
version=$(head -n 1 "$ROOT_VERSION_FILE")

# Function to bump the version, preserving any suffix (e.g. -lts, -beta)
bump_version() {
  local v="$1"
  if [[ "$v" == *"-"* ]]; then
    suffix="${v##*-}"
    base="${v%-*}"
    IFS='.' read -r major minor patch <<< "$base"
    patch=$((patch + 1))
    echo "${major}.${minor}.${patch}-${suffix}"
  else
    echo "$v"
  fi
}

new_version=$(bump_version "$version")

# Capture the branch we're bumping from (used as the PR base) before switching
source_branch=$(git rev-parse --abbrev-ref HEAD)

# If "--create-branch" was passed, branch off the current branch before bumping
if [[ "$ARG" == "$CREATE_BRANCH_FLAG" ]]; then
  branch_name="chore/bump-version-${new_version}"
  git checkout -b "$branch_name"
  echo "Created branch $branch_name"
fi

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

# When branching, commit the version files, push and open a PR to the source branch
if [[ "$ARG" == "$CREATE_BRANCH_FLAG" ]]; then
  git add "$ROOT_VERSION_FILE" "$SERVER_VERSION_FILE" "$FRONTEND_VERSION_FILE"
  git commit -m "chore: bump version to ${new_version}"
  git push -u origin "$branch_name"
  gh pr create \
    --base "$source_branch" \
    --head "$branch_name" \
    --title "chore: bump version to ${new_version}" \
    --body "Bumps version to \`${new_version}\`."
  echo "Opened PR from $branch_name to $source_branch"
fi
