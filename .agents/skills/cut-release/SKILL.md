---
name: cut-release
description: >-
  Cut a ToolJet release branch and retarget feature PRs onto it, or add more PRs to an
  already-cut release. TRIGGER when the user asks to create a release branch, start a release, cut
  an LTS or beta release, bump the release version and move PRs onto a release branch,
  retarget/rebase feature PRs to a release branch, or add/append PRs to an existing release. Creates
  release/v<version> across root + submodules, bumps the version, changes each PR's base to the
  release branch, merges the release branch into each PR branch, and comments the roster (flagging
  conflicts and @mentioning authors) on the release base PR. Re-runnable: given an existing release
  branch it skips the cut and bump and just appends the new PRs.
---

Cut a release branch, bump the version, and retarget a set of feature PRs onto it.

This skill is the interactive `gh`-based successor to `release-scripts/create-release.sh` (which is milestone + raw GitHub API driven). It reuses `release-scripts/bump-minor-version.sh` for the version bump and the root → `server/ee` → `frontend/ee` fan-out pattern from the `merge` / `create-pr` skills.

User input: $ARGUMENTS

## Inputs

Parse `$ARGUMENTS`. Two inputs are required — ask for whichever is missing before doing anything:

1. **Edition** — `lts` or `beta`.
   - `lts` → cut from **`lts-3.16`**
   - `beta` → cut from **`main`**
2. **PR list** — one or more PRs to retarget, as numbers or URLs. Each is either:
   - a **root PR** (`ToolJet/ToolJet`) — a "base-branch PR", or
   - a **submodule PR** (`ToolJet/ee-server` or `ToolJet/ee-frontend`).

   Classify each by its URL. If only a bare number is given, ask which repo it belongs to.
3. **Target release branch** *(optional)* — e.g. `release/v3.20.237-lts`. Pass this to **add PRs to an existing release** instead of cutting a new one. When omitted, the branch name is computed (Phase 1); if that branch already exists remotely, the skill switches to append mode automatically.

> **Fresh-cut vs. append mode.** If the target release branch does not yet exist → **fresh cut** (Phase 1 creates it and bumps the version). If it already exists → **append mode**: skip the version bump and branch creation, reuse the release base PRs, and just retarget/merge the new PRs onto it (Phases 2–5). The skill is re-runnable — running it again with more PRs simply adds them.

> **Edition and PR line must match.** A beta release only accepts PRs on the beta line (base `main`/`develop`); an lts release only accepts PRs on the lts line (base `lts-3.16`). A cross-line PR is a hard error — see "Validate edition vs. PR base" in Phase 2. This is checked **before anything is created**.

Requires the `gh` CLI, authenticated against `ToolJet/ToolJet`, `ToolJet/ee-server`, and `ToolJet/ee-frontend`.

---

## Shell environment notes

> **IMPORTANT:** The Bash tool runs in zsh via `eval`. Two constraints carried over from the `merge` / `create-pr` skills:
> 1. `for` loops cause `git: command not found` — **never use loops**. Use inline per-repo / per-PR commands.
> 2. Use full paths for coreutils: `/usr/bin/head`, `/usr/bin/sed`.

Set `ROOT`, `SEE`, `FEE` once at the top of each Bash call:
```bash
ROOT=$(git rev-parse --show-toplevel); SEE="$ROOT/server/ee"; FEE="$ROOT/frontend/ee"
```

---

## Phase 1 — Create the release branch and bump the version

**Skip this entire phase in append mode.** First resolve `$RELBR` and the mode:

```bash
ROOT=$(git rev-parse --show-toplevel); BASE="<lts-3.16 for lts | main for beta>"
# $RELBR = the --target release branch if given, else the computed name (Step 1).
if git -C "$ROOT" ls-remote --heads origin "$RELBR" | /usr/bin/grep -q .; then
  echo "APPEND MODE — $RELBR exists; skip version bump + branch creation, go to Phase 2."
else
  echo "FRESH CUT — create $RELBR (Phase 1 below)."
fi
```

- **Append mode** ($RELBR exists): do **not** bump the version or recreate the branch. Set `$NEWVER` from the branch name (strip the leading `release/v`). Ensure the submodule release branches exist (Step 3 is still idempotent — create any missing one). Then jump to Phase 2. The release base PRs already exist and are reused in Phase 1 Step 4 / Phase 4.
- **Fresh cut** ($RELBR absent): run the whole phase below.

The three version files (`.version`, `server/.version`, `frontend/.version`) all live in the **root** repo, so the version bump is a root-only commit.

### Step 1: Compute the bumped version and release branch name

`bump-minor-version.sh` bumps the **patch** component and preserves the suffix (`-beta`, `-lts`). Compute the same value first so we can name the branch:

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

The suffix flows from the base branch's `.version` as-is (`lts-3.16` → `-lts`, `main` → `-beta`), so `RELBR` already carries the right suffix — do **not** append another one. If `$VER` has no `-` suffix, stop and ask the user: the bump script would be a no-op.

### Step 2: Create the branch in an ISOLATED WORKTREE, bump, commit, push

**Do not switch the user's main checkout.** It has uncommitted/untracked files (including this skill's own untracked `.claude/skills/cut-release`), and the base/PR branches *track* `.claude/skills` — so `git checkout <base>` in the main tree fails with "would lose untracked files in .claude/skills" and silently leaves you on the wrong branch, and any bump then dirties the wrong tree. Create the release branch in a throwaway worktree cut from `origin/$BASE`:

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

Gotchas, each learned the hard way:
- `bash "$WT/release-scripts/..."` with cwd still at `$ROOT` bumps the **main** tree's files (script uses `./.version`). Always `( cd "$WT" && bash ./release-scripts/... )`.
- Run `bump-minor-version.sh` **without** `--create-branch` — the branch already exists; the flag would open an unwanted `chore/bump-version-*` PR.
- If the three files don't show `$NEWVER` after the bump, stop — the script didn't run.
- Keep the worktree around until Phase 3 (root-PR merges reuse it). Remove it (`git -C "$ROOT" worktree remove --force "$WT"`) only at the very end.

### Step 3: Create matching release branches in the submodules

Create `$RELBR` in **both** submodules, cut from each submodule's own base branch (`lts-3.16` for lts, `main` for beta). They are needed for two reasons, so create them whenever **any** PR (root or submodule) is in scope:

1. A **submodule PR** can only be re-based onto a branch that exists in its repo.
2. When a **root PR** is merged with the release branch, its `server/ee` / `frontend/ee` gitlink conflicts, and we resolve that pointer (Phase 3) — so the branch must exist even if no submodule PR was listed.

Operate directly on the user's `$SEE` / `$FEE` submodule checkouts (they are independent git repos — the root worktree's submodules are not initialized). **First verify each is clean**; this switches them off their current branch, so restore them at the end (Phase 4 cleanup).

```bash
git -C "$SEE" fetch origin "$BASE"
git -C "$SEE" checkout -b "$RELBR" "origin/$BASE"
git -C "$SEE" push -u origin "$RELBR"
git -C "$FEE" fetch origin "$BASE"
git -C "$FEE" checkout -b "$RELBR" "origin/$BASE"
git -C "$FEE" push -u origin "$RELBR"
```

(`$BASE` here is the submodule's own base — `lts-3.16` for lts, `main` for beta. Verify the submodule actually has that base branch before cutting.)

No version bump in submodules — the version files are root-only.

### Step 4: Open the release base PRs — root AND each submodule

Open a release base PR (`$RELBR` → `$BASE`) in the root repo **and in every submodule whose release branch has commits ahead of its base**. These are the PRs the Phase 4 roster is posted on. Do it **idempotently**: check first, create only if missing.

```bash
# per repo (ToolJet, ee-server, ee-frontend):
EXIST=$(gh pr list --repo <owner/repo> --head "$RELBR" --state all --json number,url -q '.[0].url')
if [ -n "$EXIST" ]; then echo "exists: $EXIST"; else
  gh pr create --repo <owner/repo> --base "$BASE" --head "$RELBR" \
    --title "Release v${NEWVER}" \
    --body "Release branch for \`${NEWVER}\`. Retargeted PRs are listed in the roster comment below."
fi
```

- Capture each repo's release-PR number/URL for Phase 4.
- A submodule PR create can fail with **"No commits between … and `$RELBR`"** — that means the submodule's release branch is identical to its base (no PRs were retargeted into it). That's expected; skip it, don't treat it as an error.
- Cross-link: put the paired root release-PR URL in each submodule PR body (and vice-versa) so they're navigable.

---

## Phase 2 — Expand the PR list

Build the full set of PRs to retarget. Keep a record per PR of: `repo`, `number`, `headBranch`, `author`.

For each input PR, fetch its metadata:
```bash
gh pr view <number> --repo <repo> --json number,headRefName,author,baseRefName,url
```

- **Root PR** (base-branch PR): take its `headRefName`, then find submodule PRs on the **same** head branch (ToolJet's convention is that a feature's root and submodule branches share a name — see the `create-pr` skill):
  ```bash
  gh pr list --repo ToolJet/ee-server   --head "<headBranch>" --state open --json number,headRefName,author,url
  gh pr list --repo ToolJet/ee-frontend --head "<headBranch>" --state open --json number,headRefName,author,url
  ```
  Add the root PR **and** any submodule PRs found to the set.
- **Submodule PR**: keep it as-is. Do **not** search for a root/base PR.

De-duplicate (a root PR and its submodule PRs may both be listed explicitly). Present the expanded set to the user before mutating anything.

### Validate edition vs. PR base — HARD STOP on mismatch

A PR's current `baseRefName` tells which release line it belongs to: base `lts-3.16` → **lts**, base `main` (or `develop`) → **beta**. A PR must match the chosen edition. Retargeting across lines is always wrong (it drags the full main↔lts divergence in as conflicts), so **error out and go no further** — do not create branches, change bases, or merge:

- edition **lts** → every PR (root and submodule) must have base `lts-3.16`.
- edition **beta** → every PR (root and submodule) must have base `main` / `develop`, i.e. **not** `lts-3.16`.

Check it **before Phase 1** has created anything — ideally run Phase 2's metadata fetch first, validate, then start Phase 1. If any PR violates the rule, stop and report, e.g.:

```
ERROR: edition=beta but these PRs target the lts line (base lts-3.16):
  - ToolJet#18174  (feat/ext-api-v2-app-access)
  - ee-server#895  (feat/ext-api-v2-app-access)
Pick edition=lts for these PRs, or remove them. Aborting — nothing was changed.
```

Because this gate must fire before any mutation, **reorder the run**: do Phase 2 (fetch + classify + expand + validate) first, and only then Phase 1 (create branches / bump / open release PR). Nothing in Phase 1 is safe to leave behind if validation fails.

---

## Phase 3 — Retarget and merge each PR

For each PR: change its base to `$RELBR` and merge `$RELBR` into its head branch so conflicts surface now. **Order matters: process submodule PRs BEFORE their paired root PRs**, because a paired root PR's gitlink must be set to the *merged* submodule PR-head tip (your chosen resolution). Keep a map `headBranch → merged submodule tip SHA` as you go.

### Step 1: Change the base branch — use REST, not `gh pr edit`

`gh pr edit --base` goes through GraphQL, which returns a flaky `Something went wrong while executing your query` 500 (seen repeatedly right after the base branch is freshly pushed). The REST PATCH is reliable (it's what `create-release.sh` used):

```bash
gh api -X PATCH repos/<owner/repo>/pulls/<number> -f base="$RELBR" --jq '.base.ref'
# verify:
gh pr view <number> --repo <owner/repo> --json baseRefName -q .baseRefName
```

### Step 2a: Submodule PRs (do these first)

Operate in the submodule's own repo dir. Capture the resulting tip:

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

Reuse the Phase 1 worktree `$WT` — the main checkout still can't switch to a PR branch (untracked `.claude/skills`). The merge conflicts only on `.version` (take the release side) and the `server/ee`/`frontend/ee` gitlinks. **Resolve a gitlink to the paired submodule PR's merged tip** (`$SUBTIP` from Step 2a) when one exists; otherwise to that submodule's `origin/$RELBR` tip. A gitlink is resolved with `update-index --cacheinfo`, NOT `checkout --theirs`:

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

Record each PR as **OK** or **CONFLICT (author)**. Before moving on, confirm `git -C "$WT" diff --name-only --diff-filter=U` is empty (never leave a half-merged tree).

> Only **version files** and **gitlink pointers** are auto-resolved — they conflict on every retarget and carry no author intent. Any **other** remaining path is a real code conflict: abort and leave it for the author. Never auto-resolve those.

### Step 3: Flag conflicted PRs

For every PR that conflicted, label it and leave it for its author (mirrors `create-release.sh`'s `merge-conflict` label). Use REST to dodge the GraphQL flakiness:
```bash
gh api -X POST repos/<owner/repo>/issues/<number>/labels -f "labels[]=merge-conflict"
```

---

## Phase 4 — Comment the roster on each release base PR

Post/refresh the roster on **every** release base PR — the **root** PR gets the full roster (all PRs, both repos); **each submodule** release PR gets a roster of that submodule's PRs. Cross-link the submodule release PR(s) from the root roster. List conflicts explicitly and **@mention the author** of each conflicted PR.

**Build the roster from a live query, not from this run's input** — so append-mode re-runs show the complete set (previously-added PRs included). Every retargeted PR has its base set to `$RELBR`, so query by base:

```bash
gh pr list --repo ToolJet/ToolJet    --base "$RELBR" --state all --json number,author,state,title
gh pr list --repo ToolJet/ee-server  --base "$RELBR" --state all --json number,author,state,title
gh pr list --repo ToolJet/ee-frontend --base "$RELBR" --state all --json number,author,state,title
```

Map each PR's status: `MERGED` → ✅ Merged; `OPEN` and reached ready in Phase 3 → ✅ ready to merge; left conflicted → ⚠️ conflict. **Update the existing roster comment in place** (don't post a duplicate on re-runs): find your prior roster comment and edit it via REST, else post a new one.

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

Status is **ready to merge** (retargeted + integrated, not yet merged), **merged** (Phase 5 done), or **conflict**. Omit the "Needs attention" section when nothing conflicted.

---

## Phase 5 — Merge the ready PRs (ask first)

Merging is **opt-in and interactive** — never merge without explicit go-ahead. Only the PRs that reached **ready to merge** in Phase 3 are eligible; conflicted ones are skipped (they belong to their authors).

Ask the user two things before merging anything:
1. **Proceed to merge** the ready PRs? (yes / no — and optionally a subset.)
2. **Merge method:** squash-and-merge or a normal merge commit? (This applies to all PRs in the batch unless the user says otherwise.)

Then merge each ready PR into its base (`$RELBR`). Merge **submodule PRs before their paired root PRs** (same reason as Phase 3 — the root PR's `server/ee` pointer should reference the merged submodule state):

```bash
# squash:
gh pr merge <number> --repo <owner/repo> --squash
# or normal merge commit:
gh pr merge <number> --repo <owner/repo> --merge
```

- If a merge is blocked (branch protection: required reviews, failing/pending checks), do **not** force it — report which PR was blocked and why, and leave it for the user. `--admin` bypasses protections and must only be used when the user explicitly asks (the release branch typically requires 1 review; `enforce_admins` is usually off, so an admin *can* bypass).
- After each merge, confirm it landed (`gh pr view <number> --json state,mergedAt`).
- **Cascade:** each merge advances `$RELBR`, so a *later* PR that shares files (or the `server/ee` gitlink) with an earlier one flips to conflicting — `gh pr merge` then fails with "Pull Request has merge conflicts". Re-sync it before merging: in a worktree, merge the **updated** `origin/$RELBR` into the PR head, resolve `.version` (release side) and each gitlink to the **submodule's current `origin/$RELBR` tip** (which now contains all already-merged submodule PRs), push, then merge. Merging in gitlink-dependency order (submodules fully merged first, then root) minimizes this.
- A merge may also fail transiently with "Base branch was modified. Review and try the merge again." — just retry the same merge once.

### Post a per-PR status comment on every PR (root AND submodule)

Beyond the roster on the release base PR, comment on **each individual PR** — root and submodule alike — with its own final outcome, so the state is visible from the PR itself:

```bash
gh pr comment <number> --repo <owner/repo> --body "<status>"
```

- **Merged:** `✅ Merged into \`$RELBR\` (squash). Part of release <release-PR-url>.`
- **Conflict** (Phase 3 couldn't auto-resolve): `⚠️ Merge conflict against \`$RELBR\` — @<author> please resolve and push.` (plus the `merge-conflict` label.)
- **Failed/blocked** (e.g. branch protection, not merged): `⏳ Retargeted onto \`$RELBR\` and ready, but not merged: <reason>.`

Then give the user a final summary: release branch, release base PR URL, and per-PR outcome (merged / ready but not merged / conflict / blocked), with authors for anything left open.

---

## Cleanup (always, even on partial failure)

```bash
git -C "$ROOT" worktree remove --force "$WT"   # remove the Phase 1 worktree
git -C "$SEE" checkout <original-branch>        # submodules were switched in Phase 1 Step 3
git -C "$FEE" checkout <original-branch>
git -C "$ROOT" worktree prune
git -C "$ROOT" branch -D "$RELBR" 2>/dev/null   # the local release branch is throwaway; the remote one stays
```

The remote release branches and PR changes are the deliverables; everything local is scratch.

---

## Guardrails

- Pushing branches and editing PR bases is outward-facing and hard to undo. Show the user the expanded PR set (end of Phase 2) and get a go-ahead before Phase 3 mutates anything. Branch/release-PR creation is low-risk; changing a teammate's PR base and pushing merge commits to their branch is the sensitive part — a good place to checkpoint.
- `gh pr edit` (base, labels) hits a flaky GraphQL 500 — prefer REST (`gh api -X PATCH .../pulls/<n> -f base=...`, `gh api -X POST .../issues/<n>/labels -f labels[]=merge-conflict`) and always verify the change took.
- Never leave a half-merged tree — after any `merge --abort` or resolve, verify `git -C "$WT" diff --diff-filter=U` is empty before continuing.
- If `gh` isn't authenticated for a submodule repo, skip that repo's PRs and report it rather than failing the whole run.
- This operates on the public root repo and private submodules. Keep the skill text itself free of private details; branch names and the release flow are public.
