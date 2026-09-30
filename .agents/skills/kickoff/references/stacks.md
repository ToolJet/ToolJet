# Stacks

Every slice gets one branch and one PR. Slices chained by blocked-by share a `gh stack`, so slice N+1 builds on slice N's branch before N merges.

## Rules

- **Operations:** only the main session runs stack commands (`init`, `add`, `rebase`, `push`, `submit`, `sync`, `merge`). Subagents only commit on the branch they were assigned.
- **Branch names:** each repo a slice touches (root, `server/ee`, `frontend/ee`) gets its own stack, using the same branch names in all three.
- **Pointers:** a root branch sets each submodule pointer to the tip of the matching EE branch.
- **Trunk:** the trunk is the base branch the user names. Ask if it is unclear; `main` for beta work, an `lts-*` branch for LTS.
- **Worktrees:** a branch can be checked out in only one worktree. Hand each subagent exactly one branch.

## Create

Create the stacks from the main checkout, bottom to top, once per repo the stack touches. Start with the EE repos:

```bash
(cd server/ee && gh stack init --base <trunk> <b1> <b2> <b3>)
(cd frontend/ee && gh stack init --base <trunk> <b1> <b2> <b3>)
gh stack init --base <trunk> <b1> <b2> <b3>
```

Skip any repo the stack doesn't touch. A slice that doesn't touch a repo still keeps its branch in that repo's stack when a later slice there needs it; otherwise leave the slice out of that repo's stack.

## Submit (after user approval)

Submit EE repos first, then root:

```bash
(cd server/ee && gh stack submit --auto)
(cd frontend/ee && gh stack submit --auto)
gh stack submit --auto
```

This opens draft PRs chained bottom to top. Then invoke `create-pr` to fill each PR body from its template. Reference issues as `ToolJet/tj-ee#N`.

If `gh stack submit` fails because stacked PRs aren't available on a repo, fall back to `create-pr` with each PR's base set to the branch below it, and tell the user.

## Keep the stack current

- **When a lower slice changes:**
  1. Run `gh stack rebase` in each EE repo.
  2. Commit the new EE tips as submodule pointers on every root branch above the change.
  3. Run `gh stack rebase` in root.
  4. Run `gh stack push` in every repo.
- **Why step 2 matters:** an EE rebase rewrites SHAs, so a root branch that isn't re-pointed references an orphaned commit.
- **Merge:** `gh stack merge <pr>` from the bottom, EE before root, then `gh stack sync --prune` in each repo.
