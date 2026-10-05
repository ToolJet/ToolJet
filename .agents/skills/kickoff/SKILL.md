---
name: kickoff
description: >-
  Interactively take a feature from a GitHub issue (or a PRD/idea that first becomes one), plus
  any linked Figma/ClickUp context or screenshots, to an approved
  vertical-slice plan, filed sub-issues in ToolJet/tj-ee, `gh stack` branches, and optionally
  AFK subagents implementing the slices with independent verification. Use when asked to kick
  off, start, plan and file, or break down and build a feature or issue end to end.
---

# Kickoff

Kickoff coordinates the other skills and doesn't reimplement them. Each step below invokes a skill, and there is a user gate between every step that files, pushes, or dispatches.

```mermaid
flowchart TD
  A[/input/] --> P{Preflight}
  P -- fail --> X[stop: report fixes]
  P --> B{GitHub issue?}
  B -- no --> C[create-issue: parent in tj-ee]
  B -- public ToolJet/ToolJet --> C
  B -- tj-ee issue --> CI[context intake: fetch via MCP or ask user]
  C --> CI
  CI --> D[decompose-plan]
  D --> G{grill?}
  G -- yes --> H[grill-me]
  G -- no --> I
  H --> I[create-issue plan mode: sub-issues]
  I --> S[gh stack branches]
  S --> L{dispatch AFK?}
  L -- yes --> M[AFK loop]
  M --> L
  L -- no / HITL --> O[human picks up]
```

## 0. Preflight

Run every check and report all failures in one message:

```bash
gh --version                                   # >= 2.60
gh auth status                                 # scopes: repo, read:org
gh repo view ToolJet/tj-ee --json name -q .name
gh stack --help >/dev/null                     # gh extension install github/gh-stack
ls -L .claude/skills/create-issue/SKILL.md     # frontend/ee checked out
```

The following two checks are needed only before dispatching subagents (step 5):
- a root `.env` or `.env.test` exists;
- `createdb` is on `PATH`.

## 1. Anchor issue

Kickoff never plans without an issue, and every issue lives in `ToolJet/tj-ee`.

| Input                               | Action                                                                                                                    |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `ToolJet/tj-ee` issue number or URL | Use it as the parent                                                                                                      |
| `ToolJet/ToolJet` issue             | Invoke `create-issue` to file a tj-ee parent that links the public URL. Private sub-issues never go under a public parent |
| PRD, file, or text                  | Invoke `create-issue` (Task or Feature) to file the parent, then continue                                                 |

## 2. Gather context (interactive)

Follow `references/context-intake.md`:
1. Inventory the links in the parent.
2. Fetch each one through an available MCP or CLI (Figma, ClickUp, …). When a server is missing or unauthenticated, offer to authenticate or set it up.
3. Otherwise ask the user to paste, screenshot, or attach the material.
4. Ask one question at a time for context the plan needs: designs, current-vs-expected screenshots, example payloads, constraints.

Nothing is planned around an unread link.

## 3. Plan

Invoke `decompose-plan` with the parent and the gathered context. It ends only when the user has explicitly approved the slices, and it writes `.agents/plans/<parent#>-<slug>.md`.

## 4. Grill (optional)

Ask: "Plan approved. Grill it before filing?" If yes, invoke `grill-me` on the plan file, then re-confirm any slice the grill changed.

## 5. File and branch

1. Invoke `create-issue` in plan mode (`frontend/ee/.agents/skills/create-issue/references/plan-mode.md`). It shows every sub-issue body for one batch approval, files the sub-issues blockers-first with a native parent, type and blocked-by, and posts the plan on the parent.
2. Create the stacks from the plan's branch names (fixed at planning, never renamed): `references/stacks.md`.
3. Print a summary table: issue, title, mode, blocked by, stack and branch.

## 6. Implement

Ask: "N AFK sub-issues are ready. Dispatch subagents?" The user picks all, some, or none. Then follow `references/afk-loop.md`.
- HITL sub-issues are never dispatched. List them for a human. When the human is done, ship the slice with `commit` and `create-pr`, using the same stack, base and template as an AFK slice.
- App Builder slices go through `app-builder-feature` or `app-builder-bug-fix`, whether a human or an agent picks them up.

## Rules

- Gates are never implied. Filing, pushing, opening PRs, and dispatching each need an explicit yes.
- **Use the repo skills for every git and GitHub write:**
  - commits go through `commit`;
  - every PR open or update goes through `create-pr`, never a raw `gh pr create` or `gh pr edit`. In a stack, pass the branch below as the base; otherwise pass the trunk;
  - issues go through `create-issue`.

  The one exception is `gh stack submit`, which opens stacked drafts. Run `create-pr` immediately after it.
- Issues are append-only. Kickoff comments on issues and never edits a body it didn't write.
- If the user stops after any step, the state is still valid: the plan file, the issues and the branches stand alone.
- Nothing about a private (EE) change goes into public PR bodies or the public tracker. See the public/private boundary in `AGENTS.md`.
