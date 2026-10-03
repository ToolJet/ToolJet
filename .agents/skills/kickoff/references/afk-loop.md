# AFK loop

Subagents build AFK slices, a fresh subagent verifies each one against its acceptance criteria, and the main session owns every worktree, stack operation, push and PR.

## Ready set

A sub-issue is ready when:
- it is open and in AFK mode;
- **every blocker's verifier has passed**. A blocker that is only committed, still being verified, or `blocked` does not release anything that depends on it.

Recompute the ready set after every verification and offer newly ready slices.

## Worktrees (main session)

A branch can be checked out in only one worktree, so the main session creates and removes them explicitly. Don't use the harness's `isolation: "worktree"` option: it cuts a new branch from HEAD instead of the stack branch.

```bash
git switch <trunk>                                  # main checkout must not hold stack branches
git -C server/ee switch --detach; git -C frontend/ee switch --detach
git worktree add ../tj-wt-<slug> <branch>           # one per dispatched slice
```

- **At most 2 builders run in parallel.** Each worktree installs its own dependencies and creates its own test databases.
- Subagents don't spawn subagents.

## Builder

Give the builder:
- the worktree path;
- the sub-issue (`gh issue view <n> --repo ToolJet/tj-ee --comments`), which is the contract;
- the parent's plan comment;
- the paths of the nearest `AGENTS.md` files, plus `server/docs/testing.md` for backend work.

Instructions, in order:

1. **Bootstrap.** `cd <worktree> && scripts/agent-worktree-setup.sh`, adding `--frontend` if the slice touches `frontend/`.
   - The submodules come from the main checkout's local repos and are switched to the same-named EE branch when it exists.
   - Never create a `.env`.
2. **Plan-first slices.** Comment a 5–10 line approach on the sub-issue and return `awaiting-approval`. Write no code until the main session resumes you with the user's answer.
3. **App Builder slices.** Follow `app-builder-feature` or `app-builder-bug-fix`.
4. **Tests first, following the slice's test-plan convention.**
   - **Backend slices** follow `server/docs/testing.md`:
     - run its decision checklist before each test;
     - match its directory layout, edition/plan describe blocks, `@group` JSDoc, seed helpers and isolation rules;
     - mock only boundaries ToolJet doesn't own, and never its own repositories in e2e.
   - **App Builder slices** follow `frontend/src/test/app-builder/README.md` through `app-builder-feature` or `app-builder-bug-fix`.
   - **Red first.**
     - Write the test each criterion's `Verify:` line names, run it, and see it fail for the right reason. For e2e, red means the real pipeline returns the wrong status or shape, not a compile error.
     - Commit the failing tests first: `test: <slice> acceptance criteria (red)`. For a bug-fix slice, this is the failing reproduction.
   - **Green.** Implement the smallest change that passes, commit it, then refactor with the tests green.
   - **No test is needed** for framework guarantees, trivial pass-throughs or DTOs without custom validation (testing.md → *What NOT to test*).
5. **Progress log.** Comment on the sub-issue at each milestone: tests written, a criterion turning green, a decision taken, blocked. When resumed, read the last comment first.
6. **Commit, then check.**
   - Commit with the `commit` skill. Pre-commit hooks must pass; `--no-verify` is never allowed.
   - Then run:
     - lint in each touched folder (`cd server && npm run lint`, and the same for `frontend`);
     - the specs for each criterion;
     - `scripts/test-changed.sh` when files under root `server/` changed. It diffs commits only, so it must run after the commit. Skip it for a submodule pointer bump alone: it treats `server/ee` as unrecognized and runs the whole suite. EE changes are covered by the criteria specs.
   - Fix any failure and commit again.
7. **No push, no PR, no stack commands.**
8. **Budget.** At most 3 failed fix cycles on the same criterion. When the budget is spent, stop, comment what you found, and return `blocked`.

The builder returns:
- the branch, and the EE branches it committed to;
- a status: `done`, `blocked` or `awaiting-approval`;
- each criterion with pass/fail and the test that proves it;
- any open questions.

## Collect (main session)

After a builder returns, bring its EE commits back into the main checkout's submodules. The worktree's submodules are separate local clones:

```bash
git -C server/ee fetch ../tj-wt-<slug>/server/ee +<branch>:<branch>     # if server/ee changed
git -C frontend/ee fetch ../tj-wt-<slug>/frontend/ee +<branch>:<branch> # if frontend/ee changed
```

The root branch is shared with the worktree, so it needs no fetch.

## Verify

For each `done` branch, dispatch a fresh verifier subagent. It gets no builder context: only the sub-issue and the branch. It runs in its own worktree on a detached checkout, because the builder's worktree may still hold the branch:

```bash
git worktree add --detach ../tj-vf-<slug> <branch>
```

The verifier's prompt:

> Refute this. In `<path>`, run `scripts/agent-worktree-setup.sh` after first `git switch -c verify/<slug>` (the script needs a named branch). For every acceptance criterion in the sub-issue, run its `Verify:` method yourself:
> - tests: run them;
> - browser checks: follow the steps against a running app and capture a screenshot.
>
>
> Then decide from the diff and the evidence whether the criterion is truly met, and probe edge cases the tests miss.
>
> Check TDD and conventions:
> - The red commit exists, and its tests fail when run against the commit before the implementation.
> - Mutation check: break the implementation on purpose; the tests must fail.
> - Backend tests follow `server/docs/testing.md`:
>   - the right unit / guard-unit / e2e choice;
>   - the planned matrix cells are present (including cross-tenant and gate denials where they apply);
>   - no mocked own repositories;
>   - no snapshot blobs;
>   - one behavior per `it`.
>
> Any violation is a `not met` finding. Post a verification report comment on the sub-issue (`Verification report` table: criterion, verdict met / not met / unclear, evidence) and return the same table.

- **Any criterion not met or unclear:** send the finding back to a builder. This counts against the 3-cycle budget.
- **Everything met:**
  1. Run `review-pr` on the local diff.
  2. Summarize for the user: the criteria, the verifier's verdicts and the review findings.
  3. Remove both worktrees: `scripts/agent-worktree-setup.sh --drop` in each, then `git worktree remove`.

## Ship (user approval required)

1. Follow `stacks.md`: submit, fill the PR bodies, and watch CI with `gh pr checks <pr> --watch`.
2. A red check goes back to a builder on that branch, within the budget. Then follow `stacks.md` → *Update after a change*.
3. Mark a PR ready (`gh pr ready <pr>`) only when CI is green.

## Circuit breaker

When a builder returns `blocked`, or the budget is spent:
- switch the sub-issue from AFK to HITL (append a comment with the findings and why);
- stop dispatching every slice stacked above it;
- tell the user.

There is no retry loop beyond the budget.

## Before any stack operation

Remove every worktree that holds a stack branch, after collecting its EE commits. `gh stack rebase`, `push` and `sync` need to check out each branch in the main checkout.
