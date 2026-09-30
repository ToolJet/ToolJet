# AFK loop

Subagents build AFK slices, a fresh subagent verifies each one, and the main session owns every push and PR.

## Ready set

A sub-issue is ready when:
- it is open and in AFK mode;
- none of its blockers is still open without a committed branch.

A blocker doesn't need to be merged: the slice builds on the blocker's stack branch.

Recompute the ready set after every subagent returns and offer newly ready slices.

## Dispatch

- **One builder subagent per ready slice**, each in its own git worktree (`isolation: "worktree"` in Claude Code), checked out on its stack branch.
- **At most 2 run in parallel.** Each worktree installs its own dependencies and creates its own test databases.
- Subagents don't spawn subagents.

## Builder prompt

Give each builder:
- the sub-issue body (`gh issue view <n> --repo ToolJet/tj-ee --comments`), which is the contract;
- the parent's plan comment;
- the paths of the nearest `AGENTS.md` files, plus `server/docs/testing.md` for backend work.

Instruct it to follow these steps in order:

1. **Bootstrap:** run `scripts/agent-worktree-setup.sh`, with `--frontend` if the slice touches `frontend/`. The script writes only `.env.test` with isolated `PG_DB` and `TOOLJET_DB`. Never create a `.env` in the worktree.
2. **Plan-first slices:** comment a 5–10 line approach on the sub-issue and return `awaiting-approval`. Write no code until the main session resumes you with the user's answer.
3. **App Builder slices:** follow `app-builder-feature` or `app-builder-bug-fix`.
4. **Tests first:** write a failing test for each acceptance criterion, then make it pass.
5. **Progress log:** comment on the sub-issue at each milestone: tests written, a criterion turning green, a decision taken, blocked. If you are resumed, read the last comment first.
6. **Before returning:**
   - run lint in each folder you touched (`cd server && npm run lint`, and the same for `frontend`);
   - run `scripts/test-changed.sh` for server changes;
   - run the frontend tests for frontend changes.
7. **Commit** with the `commit` skill. The pre-commit hooks must pass; `--no-verify` is never allowed. Do not push. Do not open PRs. Do not run stack commands.
8. **Budget:** at most 3 failed fix cycles on the same criterion. When the budget is spent, stop, comment what you found, and return `blocked`.

The builder returns:
- the branch;
- a status: `done`, `blocked` or `awaiting-approval`;
- each criterion with pass/fail and test output;
- open questions.

## Verify

For each `done` branch, dispatch a fresh verifier subagent. It gets no builder context, only the sub-issue and the branch, and its prompt is:

> Refute this. Check out `<branch>`. Rerun the tests. For every acceptance criterion, decide from the diff and your own test runs whether it is truly met. Probe edge cases the tests miss. Return a verdict per criterion: met, not met or unclear, with evidence.

- **Any criterion not met or unclear:** the finding goes back to a builder. This counts against the 3-cycle budget.
- **Everything met:** run `review-pr` on the local diff, then summarize for the user: the criteria, the verifier's verdicts, and the review findings.

## Ship (user approval required)

1. Submit the stack and fill the PR bodies: `stacks.md`.
2. Watch CI: `gh pr checks <pr> --watch`.
   - A red check goes back to a builder on that branch, within the budget. Then the main session runs `gh stack push`.
   - Mark a PR ready (`gh pr ready <pr>`) only when CI is green.

## Circuit breaker

When a builder returns `blocked` or runs out of budget:
- switch the sub-issue from AFK to HITL (append a comment with the findings and why);
- stop dispatching every slice stacked above it;
- tell the user.

There is no retry loop beyond the budget.

## Cleanup

After a branch merges or its worktree is removed, run `scripts/agent-worktree-setup.sh --drop` in that worktree to drop its test databases, then remove the worktree.
