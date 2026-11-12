#!/bin/sh
# Run inside a submodule, via `git submodule foreach` (which sets $name, $sha1, $toplevel).
# Checks out $BRANCH_NAME if the submodule has it, otherwise the branch .gitmodules tracks
# on the root branch. Bump `branch = ...` in .gitmodules when cutting a new LTS branch.

if git show-ref --verify --quiet "refs/heads/$BRANCH_NAME" ||
   git ls-remote --exit-code --heads origin "$BRANCH_NAME" >/dev/null; then
  exec git checkout "$BRANCH_NAME"
fi

FALLBACK=$(git config -f "$toplevel/.gitmodules" "submodule.$name.branch") ||
  { echo "No branch set for $name in .gitmodules"; exit 1; }
echo "Branch $BRANCH_NAME not found in submodule $name, falling back to $FALLBACK"
git checkout "$FALLBACK" || exit 1

git merge-base --is-ancestor "$sha1" HEAD 2>/dev/null ||
  echo "WARNING: $name commit $sha1 pinned by $BRANCH_NAME is not on $FALLBACK. Is the branch in .gitmodules stale?"
