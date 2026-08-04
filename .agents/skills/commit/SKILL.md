---
name: commit
description: >-
  Create commits across ToolJet's root and submodule repos (server/ee, frontend/ee). Detects dirty
  repos, generates commit messages, and updates submodule pointers in the right order. Use when
  asked to commit changes. Often followed by create-pr.
---

Create smart commits across root and submodule repos. Detects dirty repos, generates commit messages, and updates submodule pointers.

User input: $ARGUMENTS

**Usage:**
```
/commit                     # auto-generate commit messages per repo
/commit fix login redirect  # use this message for all repos
```

Parse the input:
- If empty: auto-generate a commit message for each dirty repo based on its diff.
- If non-empty: use the entire input as the commit message for **all** repos.

---

## Shell environment notes

> **IMPORTANT:** The Bash tool executes in zsh via `eval`. `for` loops cause `git: command not found` — **never use loops**. Use inline per-repo commands instead. Use full paths for coreutils: `/usr/bin/head`, `/usr/bin/sed`.

---

## Phase 1 — Detect dirty repos

Single Bash call — per-repo state for commit decisions:

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

Root's own dirtiness excludes the two submodule paths — those are pointer changes, handled in Phase 3.

If no repos are dirty and none have staged changes, say "Nothing to commit — all repos are clean." and stop.

---

## Phase 2 — Commit each dirty repo

Process in order: **server/ee → frontend/ee → root** (submodules first).

For each dirty repo:

### Step 1: Check staging state

Run in a single Bash call:
```bash
echo "=== STAGED ==="
git -C <path> diff --cached --stat
echo "=== UNSTAGED ==="
git -C <path> diff --stat
echo "=== UNTRACKED ==="
git -C <path> ls-files --others --exclude-standard
```

### Step 2: Stage if needed

- If there are **already staged changes**, respect them — do NOT add more files.
- If there are **no staged changes** but there are unstaged/untracked changes, stage everything:
  ```bash
  git -C <path> add -A
  ```

### Step 3: Generate diff for commit message

```bash
git -C <path> diff --cached
```

### Step 4: Commit

**If user provided a message** (`$ARGUMENTS` was non-empty):
```bash
git -C <path> commit -m "<user message>"
```

**If auto-generating**: Analyze the cached diff and generate a concise commit message following these rules:
- First line: type prefix (`feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `test:`, `perf:`, `ci:`) + short summary under 72 chars
- Optional body: brief explanation if the diff is non-trivial (blank line after subject)
- No file lists, no function names unless they ARE the change

```bash
git -C <path> commit -m "$(cat <<'EOF'
<generated message>
EOF
)"
```

Commit hooks can be slow — allow a generous timeout rather than assuming the call hung.

---

## Phase 3 — Update submodule pointers

**Only if** any submodule was committed in Phase 2:

```bash
git -C <root> add server/ee frontend/ee && git -C <root> diff --cached --stat
```

If there are staged submodule pointer changes, commit them:
```bash
git -C <root> commit -m "chore: update submodule pointers"
```

---

## Phase 4 — Summary

Print a summary table:

```
## Commit Summary

| Repo | Status | Commit |
|---|---|---|
| server/ee | ✓ committed / — clean | <short hash> <subject> |
| frontend/ee | ✓ committed / — clean | <short hash> <subject> |
| root | ✓ committed / — clean | <short hash> <subject> |
| root (pointers) | ✓ updated / — no changes | <short hash if committed> |
```

---

## Rules

1. **Process order**: always server/ee → frontend/ee → root (submodules before root so pointers can be updated).
2. **Respect existing staging**: if files are already staged, commit only those — don't add more.
3. **Never** force-push, reset --hard, clean, or use --no-verify. If a hook fails, fix what it reports.
4. Skip clean repos silently — only mention them in the summary table.
5. Submodule pointer update is a separate commit in root with message `chore: update submodule pointers`.
6. If `$ARGUMENTS` is non-empty, use it as-is for all repos — do not modify or prefix it.
7. **No loops** — inline per-repo commands only.
8. **Always use `git -C <path>`** — never `cd <path> && git`.

## Related skills

- `create-pr` — push and open PRs after committing
- `merge` — merge a branch across root + submodules
