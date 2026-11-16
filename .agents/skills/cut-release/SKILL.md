---
name: cut-release
description: >-
  Cuts a ToolJet release branch and retargets feature PRs onto it, or appends more PRs to an
  already-cut release. Use when the user asks to create a release branch, start a release, cut an
  LTS or beta release, bump the release version and move PRs onto a release branch,
  retarget/rebase feature PRs to a release branch, or add/append PRs to an existing release. Creates
  release/v<version> across root + submodules, bumps the version, changes each PR's base to the
  release branch, merges the release branch into each PR branch, and comments the roster (flagging
  conflicts and @mentioning authors) on the release base PR. Re-runnable: given an existing release
  branch it skips the cut and bump and just appends the new PRs.
---

Interactive `gh`-based successor to `release-scripts/create-release.sh`. Reuses `release-scripts/bump-minor-version.sh` and the root → `server/ee` → `frontend/ee` fan-out from `merge` / `create-pr`.

User input: $ARGUMENTS

## Inputs

Ask for any missing required input before doing anything:

1. **Edition** (required) — `lts` → cut from **`lts-3.16`**; `beta` → cut from **`main`**.
2. **PR list** (required) — numbers or URLs. Classify by URL: **root PR** (`ToolJet/ToolJet`, "base-branch PR") or **submodule PR** (`ToolJet/ee-server`, `ToolJet/ee-frontend`). Bare number → ask which repo.
3. **Target release branch** (optional) — e.g. `release/v3.20.237-lts`, to add PRs to an existing release. Omitted → computed in Phase 1.

**Modes.** Target branch absent remotely → **fresh cut** (Phase 1 creates it and bumps). Present → **append mode**: no bump, no branch creation, reuse the release base PRs, run Phases 2–5 only.

**Edition must match PR line** — hard error, checked before anything is created (Phase 2).

Requires `gh` authenticated against `ToolJet/ToolJet`, `ToolJet/ee-server`, `ToolJet/ee-frontend`.

**Run order:** Phase 2 (fetch, expand, validate) first, then Phase 1, then 3–5. Nothing from Phase 1 may be left behind if validation fails.

---

## Shell environment notes

The Bash tool runs zsh via `eval`:
1. `for` loops cause `git: command not found` — **never use loops**; write inline per-repo / per-PR commands.
2. Use full paths for coreutils: `/usr/bin/head`, `/usr/bin/sed`.

Start each Bash call with:
```bash
ROOT=$(git rev-parse --show-toplevel); SEE="$ROOT/server/ee"; FEE="$ROOT/frontend/ee"
```

---

## Phase 1 — Create the release branch and bump the version

**Skip in append mode.** Resolve `$RELBR` and the mode:

```bash
ROOT=$(git rev-parse --show-toplevel); BASE="<lts-3.16 for lts | main for beta>"
# $RELBR = the --target release branch if given, else the computed name (Step 1).
if git -C "$ROOT" ls-remote --heads origin "$RELBR" | /usr/bin/grep -q .; then
  echo "APPEND MODE — $RELBR exists; skip version bump + branch creation, go to Phase 2."
else
  echo "FRESH CUT — create $RELBR (Phase 1 below)."
fi
```

- **Append mode:** set `$NEWVER` from the branch name (strip leading `release/v`). Run Step 3 (idempotent — creates any missing submodule branch), reuse existing release base PRs, go to Phase 2.
- **Fresh cut:** run the whole phase.

Version files (`.version`, `server/.version`, `frontend/.version`) are root-only, so the bump is a root-only commit.

### Step 1: Compute the bumped version and release branch name

`bump-minor-version.sh` bumps the **patch** component and keeps the suffix (`-beta`, `-lts`). Compute the same value to name the branch:

```bash
ROOT=$(git rev-parse --show-toplevel)
BASE="<lts-3.16 for lts | main for beta>"
git -C "$ROOT" fetch origin "$BASE"
# Read the version from ORIGIN's base tip, not the working tree — no checkout needed,
# and immune to a stale/diverged local base branch.
VER=$(git -C "$ROOT" show "origin/$BASE:.version" | /usr/bin/head -n1)
BASEV=${VER%%-*}; SUF=${VER#*-}
IFS=. read -r MAJ MIN PAT <<< "$BASEV"
PAT=$((PAT+1))
NEWVER="${MAJ}.${MIN}.${PAT}-${SUF}"
RELBR="release/v${NEWVER}"
echo "current=$VER  new=$NEWVER  branch=$RELBR"
```

The suffix comes from the base's `.version` (`lts-3.16` → `-lts`, `main` → `-beta`); don't append another. If `$VER` has no `-` suffix, stop and ask — the bump script would be a no-op.

### Step 2: Create the branch in an ISOLATED WORKTREE, bump, commit, push

**Never switch the user's main checkout** — it may be dirty, and `git checkout <base>` can fail on untracked-file collisions and silently leave you on the wrong branch, so the bump dirties the wrong tree. Use a throwaway worktree from `origin/$BASE`:

```bash
WT="$SCRATCH/cut-release-wt"   # a scratchpad path, NOT inside the repo
git -C "$ROOT" worktree remove --force "$WT" 2>/dev/null
git -C "$ROOT" worktree add -b "$RELBR" "$WT" "origin/$BASE"   # anchored to origin — immune to a stale local base branch
# Run the bump INSIDE the worktree. The script writes ./.version relative to CWD,
# so cwd MUST be the worktree, and the file is not +x so call it via `bash`:
( cd "$WT" && bash ./release-scripts/bump-minor-version.sh )
/usr/bin/head -1 "$WT/.version" "$WT/server/.version" "$WT/frontend/.version"   # VERIFY all three == $NEWVER before committing
git -C "$WT" commit -m "chore: bump version to ${NEWVER}" -- .version server/.version frontend/.version
git -C "$WT" push -u origin "$RELBR"
```

Gotchas:
- `bash "$WT/release-scripts/..."` with cwd at `$ROOT` bumps the **main** tree (script uses `./.version`). Always `( cd "$WT" && bash ./release-scripts/... )`.
- Run **without** `--create-branch` — it would open an unwanted `chore/bump-version-*` PR.
- If the three files don't show `$NEWVER`, stop — the script didn't run.
- Keep `$WT` until the end (Phase 3 root merges reuse it); removed in Cleanup.

### Step 3: Create matching release branches in the submodules

Create `$RELBR` in **both** submodules from each submodule's own base (`lts-3.16` for lts, `main` for beta; verify that base exists) whenever **any** PR is in scope:
1. A submodule PR can only be retargeted onto a branch in its repo.
2. Root PR merges conflict on the `server/ee` / `frontend/ee` gitlinks, resolved against this branch (Phase 3) — needed even with no submodule PRs listed.

Operate on the user's `$SEE` / `$FEE` checkouts (the root worktree's submodules aren't initialized). **Verify each is clean first**; record its current branch to restore in Cleanup.

```bash
git -C "$SEE" fetch origin "$BASE"
git -C "$SEE" checkout -b "$RELBR" "origin/$BASE"
git -C "$SEE" push -u origin "$RELBR"
git -C "$FEE" fetch origin "$BASE"
git -C "$FEE" checkout -b "$RELBR" "origin/$BASE"
git -C "$FEE" push -u origin "$RELBR"
```

No version bump in submodules.

### Step 4: Open the release base PRs — root AND each submodule

Open a release base PR (`$RELBR` → `$BASE`) in root **and in every submodule whose release branch is ahead of its base**. Idempotent — create only if missing:

```bash
# per repo (ToolJet, ee-server, ee-frontend):
EXIST=$(gh pr list --repo <owner/repo> --head "$RELBR" --state all --json number,url -q '.[0].url')
if [ -n "$EXIST" ]; then echo "exists: $EXIST"; else
  gh pr create --repo <owner/repo> --base "$BASE" --head "$RELBR" \
    --title "Release v${NEWVER}" \
    --body "Release branch for \`${NEWVER}\`. Retargeted PRs are listed in the roster comment below."
fi
```

- Capture each release PR number/URL for Phase 4.
- Submodule create failing with **"No commits between … and `$RELBR`"** is expected (nothing retargeted there) — skip.
- Cross-link root and submodule release PRs in each other's bodies.

---

## Phase 2 — Expand the PR list

Record per PR: `repo`, `number`, `headBranch`, `author`.

```bash
gh pr view <number> --repo <repo> --json number,headRefName,author,baseRefName,url
```

- **Root PR:** find submodule PRs on the **same** head branch (feature branches share names across repos — see `create-pr`):
  ```bash
  gh pr list --repo ToolJet/ee-server   --head "<headBranch>" --state open --json number,headRefName,author,url
  gh pr list --repo ToolJet/ee-frontend --head "<headBranch>" --state open --json number,headRefName,author,url
  ```
  Add the root PR and any submodule PRs found.
- **Submodule PR:** keep as-is; don't search for a root PR.

De-duplicate. Present the expanded set to the user before mutating anything.

### Validate edition vs. PR base — HARD STOP on mismatch

`baseRefName` gives the line: `lts-3.16` → **lts**; `main` / `develop` → **beta**. Cross-line retargeting drags the full main↔lts divergence in as conflicts, so on any mismatch **error out** — no branches, base changes or merges:

- edition **lts** → every PR (root and submodule) has base `lts-3.16`.
- edition **beta** → every PR has base `main` / `develop` (**not** `lts-3.16`).

```
ERROR: edition=beta but these PRs target the lts line (base lts-3.16):
  - ToolJet#18174  (feat/ext-api-v2-app-access)
  - ee-server#895  (feat/ext-api-v2-app-access)
Pick edition=lts for these PRs, or remove them. Aborting — nothing was changed.
```

---

## Phase 3 — Retarget and merge each PR

Get the user's go-ahead on the expanded set first (see Guardrails). For each PR: set its base to `$RELBR`, then merge `$RELBR` into its head so conflicts surface now. **Process submodule PRs BEFORE their paired root PRs** — the root PR's gitlink must point at the merged submodule tip. Keep a map `headBranch → merged submodule tip SHA`.

### Step 1: Change the base branch — use REST, not `gh pr edit`

`gh pr edit --base` (GraphQL) flakily returns `Something went wrong while executing your query` right after the base is pushed. REST is reliable:

```bash
gh api -X PATCH repos/<owner/repo>/pulls/<number> -f base="$RELBR" --jq '.base.ref'
# verify:
gh pr view <number> --repo <owner/repo> --json baseRefName -q .baseRefName
```

### Step 2a: Submodule PRs (first)

```bash
D="<$SEE | $FEE>"
git -C "$D" fetch origin "<headBranch>" "$RELBR"
git -C "$D" checkout -B "<headBranch>" "origin/<headBranch>"
if git -C "$D" merge --no-edit "origin/$RELBR"; then
  git -C "$D" push origin "<headBranch>"
  echo "SUBTIP <headBranch>=$(git -C "$D" rev-parse HEAD)"   # record for the paired root PR
else
  git -C "$D" merge --abort; echo "CONFLICT <repo>#<number>"   # label + author (Step 3)
fi
```

### Step 2b: Root PRs (merge in the WORKTREE, not the main checkout)

Reuse `$WT`. Expected conflicts: `.version` (take release side) and the `server/ee` / `frontend/ee` gitlinks. **Resolve each gitlink to the paired `$SUBTIP`** (Step 2a) if one exists, else to that submodule's `origin/$RELBR` tip — via `update-index --cacheinfo`, NOT `checkout --theirs`:

```bash
git -C "$ROOT" fetch origin "<headBranch>" "$RELBR"
git -C "$WT" checkout -B "<headBranch>" "origin/<headBranch>"
git -C "$WT" merge --no-edit "origin/$RELBR"   # exits non-zero on the expected gitlink/version conflicts
# version files -> release side (often already auto-merged; harmless if nothing staged):
git -C "$WT" checkout --theirs .version server/.version frontend/.version 2>/dev/null; git -C "$WT" add .version server/.version frontend/.version 2>/dev/null
# each CONFLICTED gitlink -> paired merged submodule tip ($SUBTIP) or that submodule's origin/$RELBR:
git -C "$WT" update-index --cacheinfo 160000,"<SUBTIP-or-$RELBR-tip>",server/ee
# (repeat for frontend/ee only if it is in the unmerged list)
REM="$(git -C "$WT" diff --name-only --diff-filter=U)"
if [ -z "$REM" ]; then
  git -C "$WT" commit --no-edit && git -C "$WT" push origin "<headBranch>"
  echo "OK <repo>#<number>"
else
  git -C "$WT" merge --abort; echo "CONFLICT <repo>#<number> -> $REM"   # real code conflict
fi
```

Record each PR as **OK** or **CONFLICT (author)**. Confirm `git -C "$WT" diff --name-only --diff-filter=U` is empty before moving on.

> Auto-resolve **only** version files and gitlink pointers (they conflict on every retarget, no author intent). Any other path is a real code conflict: abort and leave it for the author.

### Step 3: Flag conflicted PRs

Label each conflicted PR (REST, same GraphQL flakiness):
```bash
gh api -X POST repos/<owner/repo>/issues/<number>/labels -f "labels[]=merge-conflict"
```

---

## Phase 4 — Comment the roster on each release base PR

Root release PR gets the full roster (all repos) and links the submodule release PRs; each submodule release PR gets its own repo's PRs. List conflicts and **@mention each conflicted PR's author**.

**Build from a live query, not this run's input**, so append-mode re-runs show the complete set:

```bash
gh pr list --repo ToolJet/ToolJet    --base "$RELBR" --state all --json number,author,state,title
gh pr list --repo ToolJet/ee-server  --base "$RELBR" --state all --json number,author,state,title
gh pr list --repo ToolJet/ee-frontend --base "$RELBR" --state all --json number,author,state,title
```

Status: `MERGED` → ✅ Merged; `OPEN` and ready in Phase 3 → ✅ ready to merge; conflicted → ⚠️ conflict. **Update the existing roster comment in place** on re-runs; post new only if none exists:

```bash
# find a prior roster comment id (first one whose body starts with the roster heading):
gh api repos/ToolJet/ToolJet/issues/<release-pr-number>/comments --jq '.[] | select(.body|startswith("## Retargeted onto")) | .id' | /usr/bin/head -1
# edit it:   gh api -X PATCH repos/ToolJet/ToolJet/issues/comments/<id> -f body="$(cat <<'EOF' ... EOF)"
# or create: gh pr comment <release-pr-number> --repo ToolJet/ToolJet --body "$(cat <<'EOF' ... EOF)"
```

Roster body shape:
```
## Retargeted onto `release/vNEWVER`

| PR | Repo | Author | Status |
|----|------|--------|--------|
| #123 | ToolJet | @alice | ✅ ready to merge |
| #45  | ee-server | @bob | ⚠️ conflict |

### Needs attention (merge conflicts)
- ee-server#45 — @bob: resolve conflicts against `release/vNEWVER` and push.
```

Omit "Needs attention" when nothing conflicted.

---

## Phase 5 — Merge the ready PRs (ask first)

**Never merge without explicit go-ahead.** Only PRs that reached ready to merge in Phase 3 are eligible; conflicted ones belong to their authors.

Ask before merging anything:
1. **Proceed to merge** the ready PRs? (yes / no / a subset)
2. **Merge method:** squash or normal merge commit? (applies to the whole batch unless told otherwise)

Merge into `$RELBR`, **submodule PRs before their paired root PRs**:

```bash
# squash:
gh pr merge <number> --repo <owner/repo> --squash
# or normal merge commit:
gh pr merge <number> --repo <owner/repo> --merge
```

- Blocked by branch protection (reviews, checks) → don't force; report the PR and reason. `--admin` only when the user explicitly asks.
- Confirm each merge landed: `gh pr view <number> --json state,mergedAt`.
- **Cascade:** each merge advances `$RELBR`, so a later PR sharing files or the gitlink can flip to "Pull Request has merge conflicts". Re-sync in a worktree: merge the **updated** `origin/$RELBR` into its head, resolve `.version` (release side) and each gitlink to the **submodule's current `origin/$RELBR` tip**, push, then merge.
- "Base branch was modified. Review and try the merge again." → retry once.

### Post a per-PR status comment on every PR (root AND submodule)

```bash
gh pr comment <number> --repo <owner/repo> --body "<status>"
```

- **Merged:** `✅ Merged into \`$RELBR\` (squash). Part of release <release-PR-url>.`
- **Conflict:** `⚠️ Merge conflict against \`$RELBR\` — @<author> please resolve and push.` (plus the `merge-conflict` label.)
- **Failed/blocked:** `⏳ Retargeted onto \`$RELBR\` and ready, but not merged: <reason>.`

Final summary to the user: release branch, release base PR URL, per-PR outcome (merged / ready but not merged / conflict / blocked), authors for anything open.

---

## Cleanup (always, even on partial failure)

```bash
git -C "$ROOT" worktree remove --force "$WT"   # remove the Phase 1 worktree
git -C "$SEE" checkout <original-branch>        # submodules were switched in Phase 1 Step 3
git -C "$FEE" checkout <original-branch>
git -C "$ROOT" worktree prune
git -C "$ROOT" branch -D "$RELBR" 2>/dev/null   # the local release branch is throwaway; the remote one stays
```

---

## Guardrails

- Show the expanded PR set (end of Phase 2) and get a go-ahead before Phase 3 — changing a teammate's PR base and pushing merge commits to their branch is the sensitive, hard-to-undo part.
- Prefer REST over `gh pr edit` for bases and labels; always verify the change took.
- Never leave a half-merged tree — after any `merge --abort` or resolve, verify `git -C "$WT" diff --diff-filter=U` is empty.
- `gh` not authenticated for a submodule repo → skip that repo's PRs and report it.
- Root repo is public, submodules private. Keep this skill text free of private details.
