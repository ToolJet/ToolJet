# Stacks: branch, rebase and merge strategy

Every slice gets one branch and one PR. Slices chained by blocked-by share a `gh stack`, so slice N+1 builds on slice N's branch before N merges.

## Rules

- **Branch names** come from the plan: `<type>/<parent#>-s<n>-<slug>`. They are fixed before filing and never renamed.
- **Public-safe names.** Root branch names, commit subjects and PR titles are public. Describe the change generically: no customer names, nothing that exists only in EE.
- **Repos.** Each repo a stack touches (root, `server/ee`, `frontend/ee`) gets its own stack, with the same branch names. A layer that doesn't change an EE repo has no branch there.
- **Pointer rule.** Root branch `k` points each submodule at the tip of that repo's branch `k`. If that repo has no branch `k`, it points at the nearest lower layer's branch, or at the trunk commit when there is none.
- **Who runs stack commands.** Only the main session, and only with no worktree holding a stack branch (see `afk-loop.md` → *Before any stack operation*).
- **Trunk.** The base branch the user names: `main` for beta work, an `lts-*` branch for LTS. Ask if it's unclear.
- **Force pushes.** `push`, `sync` and `rebase` followed by `push` rewrite remote branches (`--force-with-lease`). Show the user the exact command and wait for a yes every time.

## Create

Create the stacks from the main checkout, EE repos first, bottom to top. Only include layers that touch that repo:

```bash
(cd server/ee && gh stack init --base <trunk> <b1> <b3>)
(cd frontend/ee && gh stack init --base <trunk> <b1> <b2> <b3>)
gh stack init --base <trunk> <b1> <b2> <b3>
```

## Submit (user approval)

```bash
(cd server/ee && gh stack submit --auto)
(cd frontend/ee && gh stack submit --auto)
gh stack submit --auto
```

- `--auto` opens draft PRs chained bottom to top, titled from the commits. Immediately run `create-pr` to set public-safe titles and the template bodies, referencing issues as `ToolJet/tj-ee#N`.
- If `gh stack submit` fails because stacked PRs aren't available on a repo, use `create-pr` with each PR's base set to the branch below it, and tell the user.
- **A single independent slice** (no stack): ship it with `create-pr` alone, based on the trunk.
- **Never run raw `gh pr create` or `gh pr edit`.** `create-pr` finds the PR by its head branch, then pushes, links the EE PRs and applies the template.

## Update after a change

Use this when a lower slice changes (a review or CI fix), or when trunk moves and a PR conflicts or goes stale.

1. **EE repos first.** For each EE repo with a stack:
   - Run `gh stack rebase`, or `gh stack sync` once submitted. `sync` fetches, fast-forwards trunk, cascade-rebases and pushes atomically.
   - Rebases rewrite EE SHAs.
2. **Root.** Run `gh stack rebase`. Conflicts on `server/ee` or `frontend/ee` are expected. Resolve each one by pointing at the EE tip for the branch being rebased:

   ```bash
   b=$(sed 's|refs/heads/||' .git/rebase-merge/head-name)
   git -C server/ee checkout -q "<EE branch for $b per the pointer rule>"
   git -C frontend/ee checkout -q "<EE branch for $b per the pointer rule>"
   git add server/ee frontend/ee && gh stack rebase --continue
   ```

3. **Check every pointer** before pushing. Each root branch must match the pointer rule:

   ```bash
   git ls-tree <b> server/ee frontend/ee        # recorded
   git -C server/ee rev-parse <b>               # expected (or the nearest lower layer)
   ```

   On a mismatch: `git switch <b>`, check out the right EE branches, commit `chore: update submodule pointers`, then `gh stack rebase --upstack` and check again.
4. **Push** (after a yes): `gh stack push` in each EE repo, then in root.

A root branch that isn't re-pointed after an EE rebase references orphaned commits, and its CI fails on the submodule checkout.

## Merge

- **Method: merge commit** (`--merge`). All three repos allow it, and root `main` already merges PRs this way. A merge commit keeps the EE branch commits' SHAs, so root pointers to them stay valid after the EE PR merges. Squash or rebase merges create new EE SHAs and orphan every root pointer above them. Never use them for stacked work.
- **Order:** bottom layer first, and within a layer every EE PR before its root PR:
  1. `cd server/ee && gh stack merge <pr> --merge`, and the same in `frontend/ee`.
  2. `gh stack merge <pr> --merge` in root, once its CI is green against the merged EE commits.
  3. `gh stack sync --prune` in every repo. This retargets the next layer onto trunk, rebases it and deletes merged branches.
  4. Repeat for the next layer.
- **Ready to merge** means: CI green, the verifier passed, `review-pr` findings resolved, and the user approved.
- Never merge a layer while a layer below it is still open.
