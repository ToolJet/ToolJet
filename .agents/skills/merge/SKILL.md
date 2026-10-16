---
name: merge
description: >-
  Merges a source branch into the current branch across all ToolJet repos (root + server/ee +
  frontend/ee submodules), handling conflicts, stashing, submodule gitlinks and ordering. Use when
  asked to merge, sync with, update from, or bring in changes from another branch.
---

User input: `$ARGUMENTS` — empty: merge the branch's base (Branch policy); otherwise the whole input is the **source branch**.

```
/merge                  # merge the branch's base (open PR base, else main)
/merge main             # merge main into current branch
/merge feature/foo      # merge feature/foo into current branch
```

## Branch policy

With no source given, merge the branch's base:
- the base of its open PR (`gh pr view --json baseRefName`);
- otherwise the remote's default branch, `main`, read from `git ls-remote --symref origin HEAD` (local `origin/HEAD` goes stale).

Release line (e.g. an `lts-*` backport) or unclear → ask the user.

**Gotcha:** a merge commit runs the pre-commit hook on every incoming file. An untracked file inside a submodule (e.g. a stray lock file in `server/ee`) makes lint-staged fail with "Unstaged changes could not be restored". Move such files aside, commit, then put them back.

**Shell:** Bash runs in zsh via `eval`; `for` loops fail with `git: command not found`. **Never use loops** — inline per-repo commands. Full paths for coreutils: `/usr/bin/head`, `/usr/bin/sed`, `/usr/bin/find`.

## Phase 1 — Analysis (single Bash call)

Replace `<source>`:

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

## Phase 2 — Merge

### All repos up to date
Print and stop:
```
All repos are up to date with `<source>`.

| Repo | Branch | Status |
|---|---|---|
| server/ee | <branch> | up to date |
| frontend/ee | <branch> | up to date |
| root | <branch> | up to date |
```

### Otherwise: server/ee → frontend/ee → root

For each repo NOT up to date whose source branch EXISTS on the remote, a **separate Bash call** per repo.

#### Current branch IS the source (fast-forward)
```bash
git -C <path> pull --ff-only origin <source>
```

#### Dirty
```bash
git -C <path> stash push -m "merge-auto-stash-$(date +%Y%m%d-%H%M%S)" && git -C <path> merge origin/<source> --no-edit && git -C <path> stash pop
```

Merge fails (conflicts) → list them with `git -C <path> diff --name-only --diff-filter=U`. Do NOT pop the stash. Note as conflicted, continue to the next repo.

#### Clean
```bash
git -C <path> merge origin/<source> --no-edit
```

Conflicts → same handling.

#### Source branch missing → skip
```
⚠ <repo>: source branch `<source>` not found on remote — skipping
```

### Submodule gitlink conflicts in root

`Failed to merge submodule <path> (commits not present)` = the pinned commit isn't in the local submodule clone.

**Root's gitlink is the authority, not the submodule's branch.** Root `main` often pins submodule commits unreachable from the submodule's `main` (release commits pushed as pointers without a branch); merging the submodule's `origin/main` gives the wrong pointer.

Resolve:

1. Read the commit root wants: `git -C <root> ls-tree origin/<source> <submodule path>`
2. Fetch it by SHA — it may not be on any branch: `git -C <submodule> fetch origin <sha>`
3. Merge that SHA into the submodule (not its `origin/<source>`): `git -C <submodule> merge <sha> --no-edit`
4. If the submodule had no local commits of its own, check it out directly instead: `git -C <submodule> checkout --detach <sha>`
5. Back in root: `git -C <root> add <submodule path>`

Before committing, `git -C <root> submodule status` must show no `+` or `-` prefix (each gitlink matches its checked-out HEAD).

### Summary
```
## Merge Summary

Source: `<source>`

| Repo | Branch | Behind | Result |
|---|---|---|---|
| server/ee | <branch> | <n> commits | ✓ merged / ✓ up to date / ⚠ skipped / ✗ conflicts |
| frontend/ee | <branch> | <n> commits | ✓ merged / ✓ up to date / ⚠ skipped / ✗ conflicts |
| root | <branch> | <n> commits | ✓ merged / ✓ up to date / ⚠ skipped / ✗ conflicts |
```

### Conflicts

List conflicted files per repo, then offer to resolve them one at a time:
1. Read each conflicted file
2. Suggest and apply resolution via Edit tool
3. After all conflicts in a repo: `git -C <path> add -A && git -C <path> commit --no-edit`
4. Pop stash if one was created: `git -C <path> stash pop`
5. If stash pop conflicts, report separately — do NOT abort the merge

No conflicts → print `All merges completed cleanly.`

## Rules

1. **Order:** server/ee → frontend/ee → root (owned by `commit`).
2. **Continue through all repos** even if one has conflicts — report everything at the end.
3. **Never** force-push, reset --hard, clean, or use --no-verify.
4. **Named stash entries** (`merge-auto-stash-<timestamp>`) for easy identification.
5. **Do NOT ask for confirmation** — merges are reversible with `git merge --abort`.
6. **Fast-forward** if current branch IS the source branch.
7. Missing source branch on a submodule = skip with warning, not failure.
8. Stash pop conflicts are separate from merge conflicts — report but don't abort.
9. **No loops**; **always `git -C <path>`**, never `cd <path> && git`.

## Related skills

- `commit` — commit across root + submodules
- `create-pr` — push and open PRs across root + submodules
