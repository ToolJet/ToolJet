#!/bin/sh
# Run inside a submodule via `git submodule foreach`. Checks out $BRANCH_NAME if the
# submodule has it, otherwise keeps the commit the root commit pins. Release builds pass
# the tag as BRANCH_NAME, so they always get the pins the release recorded.
if git show-ref --verify --quiet "refs/heads/$BRANCH_NAME" ||
   git ls-remote --exit-code --heads origin "$BRANCH_NAME" >/dev/null; then
  git checkout "$BRANCH_NAME"
else
  echo "Branch $BRANCH_NAME not found in submodule $name, keeping pinned commit"
fi
