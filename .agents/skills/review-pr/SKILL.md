---
name: review-pr
description: >-
  Review a ToolJet pull request of any size and produce a findings report the user reads first.
  Use when asked to review, look over, check, critique, or comment on a PR, a branch, or a diff,
  or to find blockers before merge. Starts by asking for review context (issue, spec, prior
  threads, known deviations), scales the process to the size of the diff, covers the root repo
  plus the ee-server and ee-frontend submodule PRs. Posting to GitHub is a separate, opt-in step
  the user asks for explicitly, never a default.
---

# Review a pull request

Produce findings that survive a challenge from the author, anchored to lines the author can act
on, in the voice the user would use. Read the diff as concepts that build on each other, tests
first, then report what is worth a thread.

The deliverable is a report file. Nothing reaches GitHub unless the user asks for it after
reading the report. A review posted before the user has weighed each finding puts their name on
claims they have not checked, and a deleted thread still shows in the author's notifications.

## Intake

Ask before reading any diff. Context decides what counts as a finding: a deliberate spec deviation
is not a bug, and a product decision already made is not a question. Reviewing cold and then
learning the answer costs a deleted thread.

One question, with options:

1. Links to fetch: GitHub issue, PR, spec, design doc. Fetched with `gh issue view`, `gh pr view`,
   or the doc tool that fits.
2. Pre-context pasted inline: Slack thread, prior review notes, product decisions, known deviations.
3. None. Review cold.

Also accept the target as a PR number, URL, or branch name. Default target is the current
branch's PR (`gh pr view`). Never review a PR the user has not named or implied by branch.

Procedure, SHAs, and how to pull existing threads: `references/context-intake.md`. Read it at the
start of every review.

## Scale

Size is the sum of additions and deletions across the root PR and both submodule PRs. Thresholds
are rough; pick the tier that matches the reading effort, not the number.

| Tier | Size | Process |
|---|---|---|
| Small | under ~1k lines | Single pass in the main thread. No sections, no subagents. One report file. |
| Medium | ~1k to ~8k | Two to five conceptual sections. Subagents optional, one per section when they are used. One report file with a section per concept. |
| Large | above ~8k | One subagent per section. Index file with blocker table, one file per section, handoff doc for everything below the bar. If posting is later requested, Blocker and High only. |

A small PR touching a migration or an auth path gets the large-tier lenses at small-tier mechanics.

## Workflow

1. Run intake. Record head SHAs for root, `server/ee`, `frontend/ee`. Fetch existing review
   comments on all three PRs so no open thread is duplicated and new findings match the tone
   already on the PR.
2. Read the PR description in full. Its claims ("covered by tests", manual checklists) are
   hypotheses. Verify or refute each and say which.
3. Read the closest `AGENTS.md` for every module touched, `UBIQUITOUS_LANGUAGE.md`, and the maps
   under `.agents/context/` when the PR crosses a system boundary.
4. Split into conceptual sections (medium and large only). A section is one concept, ordered so
   each builds on the last: data model, resolver, services, API surface, frontend.
5. Start every section at its tests. The spec says what the author believes the contract is, the
   implementation says what it is, the gap is the review. Apply the mutation heuristic from
   `server/docs/testing.md` to each new test: break the implementation, and if the suite stays
   green the test asserts nothing.
6. Apply the lenses below. Every finding carries `file:line` verified inside a diff hunk at the
   recorded head. An unanchored finding is an opinion and stays out.
7. Consolidate. Two sections finding the same thing is signal, but only one entry carries it.
   Correct the first pass against what the section reads disproved.
8. Verify. A fresh subagent, given the report and the head files, tries to refute every finding:
   the anchor lines, each factual claim, and reachability. A branch that exists but cannot
   execute (its lookup can never match, a constraint blocks its input) is not a finding; that is
   the miss a first pass makes most often, because it checks that code is present and not that
   it runs. Withdraw what fails and say so in the report, with the evidence.
9. Write the report (Output contract below) and hand the path to the user. Stop there. Each
   finding is already written as the comment it would become, so posting later is a copy, not a
   rewrite.
10. Only when the user asks to post: confirm which findings, re-verify anchors against the
    current heads, then follow `references/posting.md`.

## Lenses

Cite the repo's own authority in the finding instead of restating the rule. Detail per lens,
with what to look for and how to phrase it: `references/lenses.md`. Read it before the first
section.

| Lens | Authority |
|---|---|
| Correctness | Section's own contract, tests, `.agents/context/architecture-map.md` for cross-boundary flows. Every tenant, environment, edition. |
| Tests | `server/docs/testing.md`: mutation heuristic, `toMatchObject` shape assertions, behavior matrix, boundary rule. `frontend/AGENTS.md` Testing context. |
| Typing | `server/AGENTS.md` Design principles. No `any`; precise types or `unknown` casts. |
| Comments | Exhaustive sweep, one verdict per block the diff adds: DELETE (default), KEEP as one line only when the WHY is not deducible from code, symbol, or test name, AGENTS.md only for a general module rule. Deletion beats relocation. |
| Design | `server/AGENTS.md` Design principles: pure calculations out of I/O, stratified design, deep modules. Practical refactors only. |
| Conventions | Closest `AGENTS.md` plus the living-docs rule in root `AGENTS.md`: a changed invariant with no `AGENTS.md` update is a finding. Glossary terms from `UBIQUITOUS_LANGUAGE.md`. |
| API contract | `.agents/skills/api-design/SKILL.md`. Only when `server/src/modules/**/controller*.ts`, `dto/`, or `external-apis/` are touched. |
| Security | `server/AGENTS.md` Security, `frontend/AGENTS.md` Security, root `AGENTS.md` Public/private boundary. |

## Submodules

The PR is three PRs: root (`ToolJet/ToolJet`), `server/ee` (`ToolJet/ee-server`), `frontend/ee`
(`ToolJet/ee-frontend`). Cover every file in all three. Every finding records which of the three
PRs it belongs to and that PR's head SHA; check the path for the EE marker before matching
against the root repo.

The root repo is public. A finding destined for the root PR never quotes private source, private
paths, customer data, or private issue context. State the invariant in public terms and point at
the EE thread.

## Finding format

Write every finding as the comment it would become, per `references/comment-format.md`. Read it
before drafting the first finding. The opening line differs by tier: plain consequence sentence
for small and medium, severity-tagged for large where triage across many threads matters.

Standing tone rules, every finding, every tier:

- Address the author, "we" voice, suggestion tone. `suggestion` blocks when the change sits on
  the anchored lines.
- Plain English. Short paragraphs, no review vocabulary, the PR author's jargon expanded or
  avoided. Bullets only for lists the reader scans. A diagram (mermaid or ascii) whenever the
  point is a flow or two paths converging.
- An `Impact.` paragraph, written as the scenario the user or operator hits, whenever the
  finding reaches past the codebase. Omitted otherwise.
- No em dashes. No meta-commentary about how the review was done. No praise padding; a decision
  worth affirming is a finding ("keep X, because Y").
- One finding per entry. GitHub resolves per thread, so an entry that bundles two findings
  cannot be posted as is.

## Output contract

The report lives under the scratchpad unless the user names another location. Hand the path
back with a short summary: blocker count, what was checked and found clean, and any open
questions for the user.

Every finding entry carries: target PR and head SHA, `path:line` (with `start_line` for a range),
the drafted comment body, and a one-line rationale for the severity. That is exactly what
posting needs, so the report doubles as the posting queue.

Small and medium tiers: one `review.md`, findings ordered by severity, then a "checked and
clean" list.

Large tier:

- `index.md`: blocker table (`file:line`, one-line consequence, section), cross-cutting themes,
  and the section list.
- One file per section with the drafted findings and what was checked and found clean.
- `handoff.md`: everything below the posting bar, grouped by section, complete enough to read
  cold. Lead with the themes that cover most of the list, then the anchored entries.

## Posting (opt-in)

Do not post, and do not offer to post, in the same turn as the report. The user decides after
reading. When they ask:

1. Confirm which findings go up (all, or a named subset) and whether a root comment is wanted.
   Default is inline comments only, no review body.
2. Re-verify every anchor against the current head SHAs. A head that moved since the report
   invalidates the lines.
3. Post per `references/posting.md`: mechanics, verified `gh api` calls, and the failure modes
   that cost a re-post. Read it before the first POST.
4. Reply with every posted comment as a URL, grouped by PR, and anything skipped and why.

## Filing findings as issues

When a finding is out of the PR's scope but worth tracking, file it with the `create-issue` skill,
the only sanctioned path for an agent to open an issue. It targets `ToolJet/tj-ee` and applies the
required `Agent` and `review-pr` labels. Always ask the human for explicit approval before creating
any issue; being asked to review is not approval to file. Do not call `gh issue create` directly,
and never file to the public repository.

## Boundaries

- Analysis only. Never edit the PR's code, and never fix a finding unless the user separately
  asks. A requested fix follows the `commit` and `create-pr` skills, never `--no-verify`.
- The report is the deliverable. Never post to GitHub unless the user asks after reading it, and
  never to a PR the user has not named.
- Never quote private submodule source or paths on the public root PR.
- Do not rate a finding's severity in one place and split threads on that rating in another; the
  severity comes from the section review and the split follows it.
