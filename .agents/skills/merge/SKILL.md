---
name: merge
description: >-
  Merge a source branch into the current branch across all ToolJet repos (root + server/ee +
  frontend/ee submodules). Handles conflicts, stashing, and submodule ordering. Use when asked to
  merge, sync with, or bring in changes from another branch.
---

Merge a source branch into the current branch across all repos (root + submodules).

User input: $ARGUMENTS

**Usage:**
```
/merge                  # merge lts-3.16 into current branch
/merge main             # merge main into current branch
/merge feature/foo      # merge feature/foo into current branch
```

Parse the input:
- If empty: source branch is `lts-3.16` (see Branch policy below)
- Otherwise: use the entire input as the **source branch** name.

---

## Branch policy

ToolJet's default base is `lts-3.16`, not `develop`. That is the default source branch when none is given.

## Shell environment notes

> **IMPORTANT:** The Bash tool executes in zsh via `eval`. Two known constraints:
> 1. `for` loops cause `git: command not found` — **never use loops**. Use inline per-repo commands instead.
> 2. Always use full paths for coreutils: `/usr/bin/head`, `/usr/bin/sed`, `/usr/bin/find`.

---

## Phase 1 — Analysis (single Bash call)

Run the following script. Replace `<source>` with the parsed source branch name.

```bash
SOURCE="<source>"
ROOT=$(git rev-parse --show-toplevel)
SEE="$ROOT/server/ee"
FEE="$ROOT/frontend/ee"

# Fetch source branch in all repos (sequential — loops are broken in this env)
git -C "$ROOT" fetch origin "$SOURCE" 2>/dev/null
[ -f "$SEE/.git" ] && git -C "$SEE" fetch origin "$SOURCE" 2>/dev/null
[ -f "$FEE/.git" ] && git -C "$FEE" fetch origin "$SOURCE" 2>/dev/null

echo "SOURCE: $SOURCE"
echo "ROOT: $ROOT"

# --- ROOT ---
echo "=ROOT="
echo "branch=$(git -C "$ROOT" rev-parse --abbrev-ref HEAD 2>/dev/null)"
echo "dirty=$(git -C "$ROOT" status --porcelain 2>/dev/null | /usr/bin/head -1)"
_src=$(git -C "$ROOT" ls-remote --heads origin "$SOURCE" 2>/dev/null | /usr/bin/head -1)
if [ -n "$_src" ]; then
  echo "source_exists=YES"
  git -C "$ROOT" merge-base --is-ancestor "origin/$SOURCE" HEAD 2>/dev/null && echo "up_to_date=YES" || echo "up_to_date=NO"
  echo "behind=$(git -C "$ROOT" rev-list HEAD..origin/$SOURCE --count 2>/dev/null)"
else
  echo "source_exists=NO"
  echo "up_to_date=N/A"
  echo "behind=0"
fi

# --- SERVER_EE ---
echo "=SERVER_EE="
if [ -f "$SEE/.git" ]; then
  echo "branch=$(git -C "$SEE" rev-parse --abbrev-ref HEAD 2>/dev/null)"
  echo "dirty=$(git -C "$SEE" status --porcelain 2>/dev/null | /usr/bin/head -1)"
  _src=$(git -C "$SEE" ls-remote --heads origin "$SOURCE" 2>/dev/null | /usr/bin/head -1)
  if [ -n "$_src" ]; then
    echo "source_exists=YES"
    git -C "$SEE" merge-base --is-ancestor "origin/$SOURCE" HEAD 2>/dev/null && echo "up_to_date=YES" || echo "up_to_date=NO"
    echo "behind=$(git -C "$SEE" rev-list HEAD..origin/$SOURCE --count 2>/dev/null)"
  else
    echo "source_exists=NO"
    echo "up_to_date=N/A"
    echo "behind=0"
  fi
else
  echo "present=NO"
fi

# --- FRONTEND_EE ---
echo "=FRONTEND_EE="
if [ -f "$FEE/.git" ]; then
  echo "branch=$(git -C "$FEE" rev-parse --abbrev-ref HEAD 2>/dev/null)"
  echo "dirty=$(git -C "$FEE" status --porcelain 2>/dev/null | /usr/bin/head -1)"
  _src=$(git -C "$FEE" ls-remote --heads origin "$SOURCE" 2>/dev/null | /usr/bin/head -1)
  if [ -n "$_src" ]; then
    echo "source_exists=YES"
    git -C "$FEE" merge-base --is-ancestor "origin/$SOURCE" HEAD 2>/dev/null && echo "up_to_date=YES" || echo "up_to_date=NO"
    echo "behind=$(git -C "$FEE" rev-list HEAD..origin/$SOURCE --count 2>/dev/null)"
  else
    echo "source_exists=NO"
    echo "up_to_date=N/A"
    echo "behind=0"
  fi
else
  echo "present=NO"
fi
```

Parse the output before proceeding to Phase 2.

---

## Phase 2 — Merge Execution

### If all repos are up to date
Print a summary and stop:
```
All repos are up to date with `<source>`.

| Repo | Branch | Status |
|---|---|---|
| server/ee | <branch> | up to date |
| frontend/ee | <branch> | up to date |
| root | <branch> | up to date |
```

### Otherwise, process repos in order: server/ee → frontend/ee → root

For each repo that is NOT up to date and where source branch EXISTS on remote, run a **separate Bash call** per repo (do not combine into one script with loops).

#### If current branch IS the source branch (fast-forward):
```bash
git -C <path> pull --ff-only origin <source>
```

#### If dirty:
```bash
git -C <path> stash push -m "merge-auto-stash-$(date +%Y%m%d-%H%M%S)" && git -C <path> merge origin/<source> --no-edit && git -C <path> stash pop
```

If the merge step fails (conflicts): run `git -C <path> diff --name-only --diff-filter=U` to list conflicted files. Do NOT pop stash. Note as conflicted and continue to the next repo.

#### If clean:
```bash
git -C <path> merge origin/<source> --no-edit
```

If conflicts, same handling as above.

#### Skip if source branch missing
```
⚠ <repo>: source branch `<source>` not found on remote — skipping
```

### Submodule gitlink conflicts in root

Root's merge of a submodule pointer can fail with `Failed to merge submodule <path> (commits not present)`. This means the pinned commit is not in the local submodule clone.

**Root's gitlink is the authority, not the submodule's own branch.** Root `main` frequently pins submodule commits that are not reachable from the submodule's `main` — release commits pushed as pointers without a branch. Merging the submodule's `origin/main` instead produces a pointer that does not match what root wants.

Resolve it:

1. Read the commit root wants: `git -C <root> ls-tree origin/<source> <submodule path>`
2. Fetch it by SHA — it may not be on any branch: `git -C <submodule> fetch origin <sha>`
3. Merge that SHA into the submodule (not its `origin/<source>`): `git -C <submodule> merge <sha> --no-edit`
4. If the submodule had no local commits of its own, check it out directly instead: `git -C <submodule> checkout --detach <sha>`
5. Back in root: `git -C <root> add <submodule path>`

Verify before committing — `git -C <root> submodule status` must show no `+` or `-` prefix, meaning each gitlink matches its checked-out HEAD.

### After all repos are processed

Print a summary table:
```
## Merge Summary

Source: `<source>`

| Repo | Branch | Behind | Result |
|---|---|---|---|
| server/ee | <branch> | <n> commits | ✓ merged / ✓ up to date / ⚠ skipped / ✗ conflicts |
| frontend/ee | <branch> | <n> commits | ✓ merged / ✓ up to date / ⚠ skipped / ✗ conflicts |
| root | <branch> | <n> commits | ✓ merged / ✓ up to date / ⚠ skipped / ✗ conflicts |
```

### If any repo had conflicts

List conflicted files per repo, then offer to resolve them one at a time:
1. Read each conflicted file
2. Suggest and apply resolution via Edit tool
3. After all conflicts in a repo: `git -C <path> add -A && git -C <path> commit --no-edit`
4. Pop stash if one was created: `git -C <path> stash pop`
5. If stash pop conflicts, report separately — do NOT abort the merge

### If no conflicts
Print: `All merges completed cleanly.`

---

## Rules

1. **Process order**: always server/ee → frontend/ee → root (submodules before root).
2. **Continue through all repos** even if one has conflicts — report everything at the end.
3. **Never** force-push, reset --hard, clean, or use --no-verify.
4. **Named stash entries** (`merge-auto-stash-<timestamp>`) for easy identification.
5. **Do NOT ask for confirmation** — merges are reversible with `git merge --abort`.
6. **Fast-forward** if current branch IS the source branch.
7. Missing source branch on a submodule = skip with warning, not failure.
8. Stash pop conflicts are separate from merge conflicts — report but don't abort.
9. **No loops** — always use inline per-repo commands (see shell environment notes).
10. **Always use `git -C <path>`** — never `cd <path> && git`.

## Related skills

- `commit` — commit across root + submodules
- `create-pr` — push and open PRs across root + submodules
