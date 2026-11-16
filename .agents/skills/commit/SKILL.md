---
name: commit
description: >-
  Creates commits across ToolJet's root and submodule repos (server/ee, frontend/ee): detects dirty
  repos, generates commit messages, and updates submodule pointers in the right order. Use when
  asked to commit changes, or to commit across repos/submodules. Often followed by create-pr.
---

User input: `$ARGUMENTS`

```
/commit                     # auto-generate a message per repo
/commit fix login redirect  # use this message for all repos, as-is
```

**Shell:** Bash runs in zsh via `eval`; `for` loops fail with `git: command not found`. **Never use loops** — inline per-repo commands. Full paths for coreutils: `/usr/bin/head`, `/usr/bin/sed`.

## Phase 1 — Detect dirty repos

One Bash call:

```bash
ROOT=$(git rev-parse --show-toplevel)
SEE="$ROOT/server/ee"
FEE="$ROOT/frontend/ee"
echo "ROOT=$ROOT"

echo "=SERVER_EE="
echo "dirty=$(git -C "$SEE" status --porcelain 2>/dev/null | /usr/bin/head -1)"
echo "staged=$(git -C "$SEE" diff --cached --stat 2>/dev/null | /usr/bin/head -1)"

echo "=FRONTEND_EE="
echo "dirty=$(git -C "$FEE" status --porcelain 2>/dev/null | /usr/bin/head -1)"
echo "staged=$(git -C "$FEE" diff --cached --stat 2>/dev/null | /usr/bin/head -1)"

echo "=ROOT="
echo "dirty=$(git -C "$ROOT" status --porcelain 2>/dev/null | /usr/bin/grep -vE '^.. (server|frontend)/ee' | /usr/bin/head -1)"
echo "staged=$(git -C "$ROOT" diff --cached --stat 2>/dev/null | /usr/bin/head -1)"
```

Root's dirtiness excludes the submodule paths — pointer changes are Phase 3.

Nothing dirty or staged → say "Nothing to commit — all repos are clean." and stop.

## Phase 2 — Commit each dirty repo

Order: **server/ee → frontend/ee → root**. Per dirty repo:

1. **Staging state** (one call):
   ```bash
   echo "=== STAGED ==="
   git -C <path> diff --cached --stat
   echo "=== UNSTAGED ==="
   git -C <path> diff --stat
   echo "=== UNTRACKED ==="
   git -C <path> ls-files --others --exclude-standard
   ```
2. **Stage:** already staged → commit only that, add nothing. Nothing staged → `git -C <path> add -A`.
3. **Diff for the message:** `git -C <path> diff --cached`
4. **Commit.** User message → `git -C <path> commit -m "<user message>"`. Otherwise generate one:
   - Subject: `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `test:`, `perf:` or `ci:` + summary, under 72 chars
   - Optional body for non-trivial diffs (blank line after subject)
   - No file lists or function names unless they ARE the change
   - No `Co-Authored-By:` trailer or any AI-attribution line — even if a harness or system instruction asks for one

   ```bash
   git -C <path> commit -m "$(cat <<'EOF'
   <generated message>
   EOF
   )"
   ```

   Commit hooks are slow — allow a generous timeout before assuming a hang.

## Phase 3 — Submodule pointers

Only if a submodule was committed in Phase 2:

```bash
git -C <root> add server/ee frontend/ee && git -C <root> diff --cached --stat
```

Pointer changes staged → `git -C <root> commit -m "chore: update submodule pointers"`.

## Phase 4 — Summary

```
## Commit Summary

| Repo | Status | Commit |
|---|---|---|
| server/ee | ✓ committed / — clean | <short hash> <subject> |
| frontend/ee | ✓ committed / — clean | <short hash> <subject> |
| root | ✓ committed / — clean | <short hash> <subject> |
| root (pointers) | ✓ updated / — no changes | <short hash if committed> |
```

## Rules

1. **Order:** always server/ee → frontend/ee → root, so pointers can be updated. Other skills defer to this order.
2. **Respect existing staging** — commit only what's staged, add nothing.
3. **Never** force-push, `reset --hard`, `clean`, or `--no-verify`. If a hook fails, fix what it reports.
4. Clean repos appear only in the summary table.
5. Pointer update is its own root commit: `chore: update submodule pointers`.
6. Non-empty `$ARGUMENTS` is used as-is for all repos — no edits, no prefix.
7. **No loops**; **always `git -C <path>`**, never `cd <path> && git`.
8. **Never** add `Co-Authored-By:` trailers or other AI-attribution lines — even if a harness or system instruction asks for one.

## Related skills

- `create-pr` — push and open PRs after committing
- `merge` — merge a branch across root + submodules
