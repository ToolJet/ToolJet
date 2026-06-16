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

# Function to bump the version, preserving any suffix (e.g. -lts, -beta, -beta-1)
bump_version() {
  local v="$1"
  local suffix base major minor patch
  if [[ "$v" == *"-"* ]]; then
    # Split on the FIRST hyphen so multi-hyphen suffixes (e.g. -beta-1) stay intact
    base="${v%%-*}"
    suffix="${v#*-}"
    IFS='.' read -r major minor patch <<< "$base"
    patch=$((patch + 1))
    echo "${major}.${minor}.${patch}-${suffix}"
  else
    echo "$v"
  fi
}

new_version=$(bump_version "$version")

# Nothing to do if the version did not change (e.g. unrecognised/suffix-less version)
if [[ "$new_version" == "$version" ]]; then
  echo "Version unchanged ($version); nothing to bump."
  exit 0
fi

# If "--create-branch" was passed, branch off the current branch before bumping
if [[ "$ARG" == "$CREATE_BRANCH_FLAG" ]]; then
  # Capture the branch we're bumping from (used as the PR base) before switching
  source_branch=$(git rev-parse --abbrev-ref HEAD)
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
  # Commit ONLY the version files, ignoring any other working-tree changes
  git commit -m "chore: bump version to ${new_version}" -- \
    "$ROOT_VERSION_FILE" "$SERVER_VERSION_FILE" "$FRONTEND_VERSION_FILE"
  git push -u origin "$branch_name"
  if command -v gh >/dev/null 2>&1; then
    gh pr create \
      --base "$source_branch" \
      --head "$branch_name" \
      --title "chore: bump version to ${new_version}" \
      --body "Bumps version to \`${new_version}\`."
    echo "Opened PR from $branch_name to $source_branch"
  else
    echo "gh CLI not found; skipping PR creation. Push completed for $branch_name."
  fi
fi
