---
name: review-pr
description: >-
  Reviews a ToolJet pull request of any size and writes a findings report the user reads first.
  Use when asked to review, look over, check, critique, or comment on a PR, a branch, or a diff,
  or to find blockers before merge. Starts by asking for review context (issue, spec, prior
  threads, known deviations), scales the process to the diff size, and covers the root repo plus
  the ee-server and ee-frontend submodule PRs. Posting to GitHub is a separate, opt-in step the
  user asks for explicitly, never a default.
---

# Review a pull request

Findings must survive the author's challenge, anchor to lines the author can act on, and read in
the user's voice. Read the diff as concepts that build on each other, tests first.

The deliverable is a report file. Nothing reaches GitHub unless the user asks after reading it: a
premature post puts their name on unchecked claims, and a deleted thread still notifies the author.

## Intake

Ask before reading any diff. Context decides what counts as a finding: an accepted spec deviation
is not a bug, a product decision already made is not a question.

One question, with options:

1. Links to fetch: issue, PR, spec, design doc (`gh issue view`, `gh pr view`, or the fitting doc tool).
2. Pre-context pasted inline: Slack thread, prior review notes, product decisions, known deviations.
3. None. Review cold.

Target: PR number, URL, or branch; default is the current branch's PR (`gh pr view`). Never review
a PR the user has not named or implied by branch.

Read `references/context-intake.md` at the start of every review (procedure, SHAs, existing threads).

## Scale

Size = additions + deletions across the root PR and both submodule PRs. Thresholds are rough;
pick the tier by reading effort, not the number.

| Tier   | Size            | Process                                                                                                                                 |
| ------ | --------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Small  | under ~1k lines | Single pass in the main thread. No sections, no subagents. One report file.                                                             |
| Medium | ~1k to ~8k      | Two to five conceptual sections; optionally one subagent per section. One report file, a section per concept.                           |
| Large  | above ~8k       | One subagent per section. Index file with blocker table, one file per section, handoff doc for the rest. If posting: Blocker and High only. |

A small PR touching a migration or an auth path gets the large-tier lenses at small-tier mechanics.

## Workflow

1. Intake. Record head SHAs for root, `server/ee`, `frontend/ee`. Fetch existing review comments
   on all three PRs so no open thread is duplicated and new findings match the tone already there.
2. Read the PR description in full. Its claims ("covered by tests", manual checklists) are
   hypotheses; verify or refute each and say which.
3. Read the closest `AGENTS.md` for every touched module, `UBIQUITOUS_LANGUAGE.md`, and the
   `.agents/context/` maps when the PR crosses a system boundary.
4. Medium and large: split into conceptual sections, one concept each, ordered so each builds on
   the last (data model, resolver, services, API surface, frontend).
5. Start every section at its tests: the spec is the author's belief about the contract, the
   implementation is the contract, the gap is the review. Apply the mutation heuristic from
   `server/docs/testing.md` to each new test: break the implementation; if the suite stays green
   the test asserts nothing.
6. Apply the lenses below. Every finding carries `file:line` verified inside a diff hunk at the
   recorded head. Unanchored findings stay out.
7. Consolidate. Two sections finding the same thing is signal, but one entry carries it. Correct
   the first pass against what section reads disproved.
8. Refutation pass. A fresh subagent, given the report and the head files, tries to refute every
   finding: anchor lines, each factual claim, reachability. A branch that exists but cannot execute
   (its lookup never matches, a constraint blocks its input) is not a finding; this is the most
   common first-pass miss, because it checks presence, not execution. Withdraw what fails and say
   so in the report, with evidence.
9. Write the report (Output contract) and hand the path to the user. Stop. Each finding is already
   the comment it would become, so posting later is a copy.
10. Only when the user asks to post: confirm which findings, re-verify anchors against current
    heads, then follow `references/posting.md`.

## Lenses

Cite the repo's authority in the finding instead of restating the rule. Read
`references/lenses.md` (what to look for, how to phrase it, severity) before the first section.

| Lens         | Authority                                                                                                                                                                                              |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Correctness  | Section's own contract, tests, `.agents/context/architecture-map.md` for cross-boundary flows. Every tenant, environment, edition.                                                                     |
| Tests        | `server/docs/testing.md`: mutation heuristic, `toMatchObject` shape assertions, behavior matrix, boundary rule. `frontend/AGENTS.md` → Testing (names `src/test/README.md`; App Builder layer).        |
| Typing       | `server/AGENTS.md` Design principles. No `any`; precise types or `unknown` casts.                                                                                                                      |
| Comments     | Exhaustive sweep, one verdict per added block: DELETE (default), KEEP as one line only when the WHY is not deducible from code, symbol, or test name, AGENTS.md only for a general module rule.         |
| Design       | `server/AGENTS.md` Design principles: pure calculations out of I/O, stratified design, deep modules. Practical refactors only.                                                                         |
| Conventions  | Closest `AGENTS.md` plus the living-docs rule in root `AGENTS.md`: a changed invariant with no `AGENTS.md` update is a finding. Glossary terms from `UBIQUITOUS_LANGUAGE.md`.                          |
| API contract | `.agents/skills/api-design/SKILL.md`. Only when `server/src/modules/**/controller*.ts`, `dto/`, or `external-apis/` are touched.                                                                       |
| Merge impact | Honest reversible verdict, stated Reach vs the diff, Rollback plan and Evidence on irreversible PRs.                                                                                                   |
| Security     | `server/AGENTS.md` Security, `frontend/AGENTS.md` Security, root `AGENTS.md` Public/private boundary.                                                                                                  |

## Submodules

The PR is three PRs: root (`ToolJet/ToolJet`), `server/ee` (`ToolJet/ee-server`), `frontend/ee`
(`ToolJet/ee-frontend`). Cover every file in all three. Every finding records its PR and that PR's
head SHA; check the path for the EE prefix before matching against the root repo.

The root repo is public. A root-PR finding never quotes private source, private paths, customer
data, or private issue context: state the invariant in public terms and point at the EE thread.

## Finding format

Write every finding as the comment it would become, per `references/comment-format.md` (read it
before the first finding). Line 1: plain consequence sentence for small and medium; severity-tagged
for large.

Tone rules, every finding, every tier:

- Address the author, "we" voice, suggestion tone. `suggestion` blocks when the change sits on the
  anchored lines.
- Plain English: short paragraphs, simple words, domain terms from `UBIQUITOUS_LANGUAGE.md`,
  anything else explained on first use. Bullets only for lists the reader scans. A diagram (mermaid
  or ascii) whenever the point is a flow or two paths converging.
- An `Impact.` paragraph, as the scenario the user or operator hits, only when the finding reaches
  past the codebase.
- No em dashes. No meta-commentary about how the review was done. No praise padding; a decision
  worth affirming is a finding ("keep X, because Y").
- One finding per entry. GitHub resolves per thread, so a bundled entry cannot be posted as is.

## Output contract

Report goes under the scratchpad unless the user names a location. Hand back the path with a short
summary: blocker count, what was checked and found clean, open questions.

Every finding entry carries: target PR and head SHA, `path:line` (`start_line` for a range), the
drafted comment body, and a one-line severity rationale. The report doubles as the posting queue.

- Small and medium: one `review.md`, findings by severity, then a "checked and clean" list.
- Large:
  - `index.md`: blocker table (`file:line`, one-line consequence, section), cross-cutting themes,
    section list.
  - One file per section: drafted findings plus what was checked and found clean.
  - `handoff.md`: everything below the posting bar, grouped by section, readable cold. Lead with
    the themes covering most of the list, then the anchored entries.

## Posting (opt-in)

Do not post, or offer to post, in the same turn as the report. The user decides after reading.
When they ask:

1. Confirm which findings go up (all, or a named subset) and whether a root comment is wanted.
   Default: inline comments only, no review body.
2. Re-verify every anchor against current head SHAs; a moved head invalidates the lines.
3. Post per `references/posting.md` (read it before the first POST).
4. Reply with every posted comment URL, grouped by PR, plus anything skipped and why.

## Filing findings as issues

For a finding out of the PR's scope but worth tracking, use the `create-issue` skill, the only
sanctioned path for an agent to open an issue. It targets `ToolJet/tj-ee` and applies the required
`Agent` and `review-pr` labels. Always get the human's explicit approval before creating any issue;
being asked to review is not approval to file. Never call `gh issue create` directly, never file to
the public repository.

## Boundaries

- Analysis only. Never edit the PR's code or fix a finding unless the user separately asks. A
  requested fix follows the `commit` and `create-pr` skills, never `--no-verify`.
- Never post to GitHub unless the user asks after reading the report, and never to a PR the user
  has not named.
- Never quote private submodule source or paths on the public root PR.
- Severity comes from the section review and the thread split follows it; never rate in one place
  and split on a different rating elsewhere.
