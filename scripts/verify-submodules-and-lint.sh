#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

echo "Checking for uncommitted changes in root..."
if ! git diff --quiet || ! git diff --staged --quiet; then
  echo "❌ Error: Uncommitted changes in root repo. Commit or stash them before pushing."
  exit 1
fi

echo "Checking for uncommitted changes in submodules..."
git submodule foreach --quiet '
  if ! git diff --quiet || ! git diff --staged --quiet; then
    echo "❌ Error: Uncommitted changes in submodule $name. Format and commit them inside $name first."
    exit 1
  fi
'

echo "Checking submodule pointer parity..."
if git submodule status | grep -q '^+'; then
  echo "❌ Error: Submodule pointers are out of sync with submodule HEAD. Commit updated submodule pointers in root before pushing."
  exit 1
fi

echo "Checking remote push parity for submodules..."
git submodule foreach --quiet '
  HEAD_REV=$(git rev-parse HEAD)
  if ! git branch -r --contains "$HEAD_REV" 2>/dev/null | grep -q "origin/"; then
    echo "❌ Error: Submodule $name has unpushed commit ($HEAD_REV). Push the submodule to origin before pushing root."
    exit 1
  fi
'

echo "Checking linting on affected directories..."
BASE_BRANCH="${BASE_BRANCH:-main}"
MERGE_BASE=$(git merge-base HEAD "origin/${BASE_BRANCH}" 2>/dev/null || git rev-parse HEAD~1 2>/dev/null || git rev-parse HEAD)
ALL_CHANGED=$(git diff --name-only "$MERGE_BASE" HEAD 2>/dev/null || true)

if echo "$ALL_CHANGED" | grep -qE "^server"; then
  echo "--- Linting Server & Server EE ---"
  npm --prefix server run lint
fi

if echo "$ALL_CHANGED" | grep -qE "^frontend"; then
  echo "--- Linting Frontend & Frontend EE ---"
  npm --prefix frontend run lint
fi

echo "✅ All pre-push submodule and lint checks passed."
