---
name: decompose-plan
description: >-
  Break a GitHub issue (PRD, feature, or larger bug) into a phased plan of thin vertical slices,
  each with a user story, acceptance criteria, AFK/HITL mode, dependencies, and a stack/branch
  assignment. Use when asked to decompose, break down, slice, or plan an issue before coding, or
  when `kickoff` runs its planning step. Produces `.agents/plans/<issue>-<slug>.md`; files nothing.
---

# Decompose into a plan

Input: a GitHub issue number or URL in `ToolJet/tj-ee`. If the user brings a PRD or free text, `kickoff` files the parent issue first; this skill always plans against an issue.

## 1. Load

```bash
gh issue view <n> --repo ToolJet/tj-ee --comments
```

- **Lightweight issue** (no user stories or scope): ask "Who is this for, what must they be able to do, and what is out of scope?" before going further.
- **Linked or missing context** (Figma, ClickUp, screenshots, recordings, examples): follow `.agents/skills/kickoff/references/context-intake.md`. Fetch through an available MCP or CLI, authenticate or offer setup when one is missing, otherwise ask the user to paste or attach the material. Every link ends up fetched, pasted, or explicitly skipped.

## 2. Clarify intent

Ask one question at a time, only the ones that change the slicing:
- the user roles;
- the must-have outcome versus nice-to-have;
- the edition (CE / EE / Cloud);
- the behavior on existing data.

Stop once the answers stop changing the plan.

## 3. Read the codebase

- Start from `AGENTS.md`, `UBIQUITOUS_LANGUAGE.md`, `.agents/context/product-map.md` and `.agents/context/architecture-map.md`, then the nearest module `AGENTS.md` (`server/src/modules/<module>/AGENTS.md`, `frontend/AGENTS.md`).
- For any backend layer, read `server/docs/testing.md` so the acceptance criteria map to real test types.
- Trace the path the feature touches: route/state → controller + guards → service → entity/migration → response → UI.

## 4. Record durable decisions

These go in the plan header and apply to every slice:
- **Edition scope:** CE (root) vs EE (`server/ee`, `frontend/ee`) vs Cloud (EE plus runtime gating).
- **Authorization:** CASL abilities, guards.
- **Data model:** entity names, relations, the schema-migration vs data-migration split.
- **Public contracts:** route paths, DTO shapes, and anything that ends up in an app definition (export, import, git-sync).

## 5. Draft vertical slices

Each slice is a thin, demoable path through every layer it needs: migration → service/controller → UI → tests. Prefer many thin slices. Never write a "do all migrations" or "build all the UI" slice.

For each slice, record:

| Field               | Rule                                                                                           |
| ------------------- | ---------------------------------------------------------------------------------------------- |
| Title               | Plain English, no planning jargon                                                              |
| Type                | Task / Feature / Bug                                                                           |
| Mode                | **AFK** (an agent can finish it alone) or **HITL** (needs a human decision). If in doubt, HITL |
| Plan-first          | Yes if it touches a migration, auth, CASL/permissions, licensing, or data deletion             |
| Blocked by          | Other slices in this plan                                                                      |
| Repos               | root, `server/ee`, `frontend/ee`                                                               |
| Stack / branch      | See below                                                                                      |
| User story          | `As a <role>, I want <capability> so that <benefit>.` exactly                                  |
| Acceptance criteria | Agent-verifiable, in the format below                                                          |

**Stacks.**
- **Chains:** slices joined by blocked-by form a chain, and each chain is one `gh stack`, bottom to top in dependency order.
- **Diamonds:** a diamond (two slices depending on one) is linearised into a single stack, in topological order.
- **Independent slices:** each gets its own stack, or a plain PR if there is only one.
- **Branches:** `<type>/<parent#>-s<n>-<slug>`. The name is final: it is known before filing and never renamed. Keep the slug public-safe, because root branch names are public.

Leave out file names and function signatures. They change as earlier slices land.

**Acceptance criteria are what the verifier subagent checks.** Each one is a single observable outcome plus how to prove it:

```markdown
- [ ] AC1: Given <state>, when <action>, then <observable result>.
  Verify: <unit | guard-unit | e2e | frontend | browser> — <what proves it: the spec to write, or the browser steps and expected screen>
```

- **One outcome per criterion.** "Works correctly", "handles errors" and "is fast" are not criteria.
- **Cover the denial path.** When the slice has authorization, add a criterion such as "a user without `<permission>` gets 403", and an edition case such as "CE returns 404 or hides the entry point".
- **Persisted shape.** When it changes, add an export/import or git-sync round-trip criterion.
- **Browser checks** list concrete steps and the expected state, so an agent can run them with Playwright or Chrome DevTools.
- **`manual`** is allowed only on HITL slices, and says who checks it.

**Test plan per slice: every slice is built test-first, using the conventions that fit it.**

| Slice touches                | Convention                                                                                                                                           | Test types                                                                                                                                                            |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `server/` or `server/ee/`    | `server/docs/testing.md`                                                                                                                             | `unit` (branching a service, guard or util owns), `guard-unit` (real CASL ability factory, no HTTP), `e2e` (meaning only exists through HTTP → guard → DB → response) |
| `frontend/src/AppBuilder/**` | `frontend/src/test/app-builder/README.md`, via `app-builder-feature` / `app-builder-bug-fix`. Widget work also goes through `app-builder-widget-tdd` | `frontend`                                                                                                                                                            |
| Other frontend               | the nearest existing specs' pattern                                                                                                                  | `frontend`, `browser` for flows                                                                                                                                       |
| Docs, config, CI only        | none: no runtime behavior to test                                                                                                                    | —                                                                                                                                                                     |

For backend slices, choose each criterion's `Verify:` type with the testing.md decision rule. List the behavior-matrix cells the slice covers, and the ones it deliberately skips:
- **Axes:** edition, plan, role/permission, module gate, tenant scope, resource state.
- **Pruning:** short-circuiting gates are tested once each, and only interacting axes are cross-producted.
- **Must-cover items that apply:**
  - every 4xx/5xx at e2e;
  - CASL allowed/denied;
  - module-gate denial distinct from license denial;
  - cross-tenant isolation on every list/read;
  - mutation correctness.

## 6. Quiz once

Show the slices as a table (title, type, mode, plan-first, blocked by, repos, stack) and ask:
- Is the granularity right? Should anything be merged or split?
- Are the dependencies and stack order correct?
- Is the AFK/HITL and plan-first marking honest?
- Is the edition scope right?

Iterate until the user explicitly approves. This is the only quiz in the pipeline; `create-issue` does not re-ask these questions.

## 7. Write the plan

Write it to `.agents/plans/<parent#>-<slug>.md`. The directory is gitignored because the root repo is public. If a file for this issue already exists, update it rather than duplicating it.

```markdown
# Plan: <feature>

> Source: ToolJet/tj-ee#<parent>

## Context sources
- <Figma frame / ClickUp task / screenshot / …>: fetched | pasted | skipped (Unknown) — <key facts used>

## Durable decisions
- Edition scope: ...
- Authorization: ...
- Data model: ...
- Public contracts: ...

## Stacks
- <stack-name>: s1 → s2 → s4
- <stack-name>: s3

## s1: <title>
- Type: Task | Mode: AFK | Plan-first: no | Blocked by: — | Repos: root, server/ee
- Branch: feat/<parent#>-s1-<slug>
- User story: As a ..., I want ... so that ...

What to build: <end-to-end behavior>

Layers: Schema: ... / API: ... / UI: ...

Test plan: convention <server/docs/testing.md | app-builder README | none> — matrix cells covered: ... ; skipped (short-circuit / no divergence): ...

Acceptance criteria:
- [ ] AC1: Given ..., when ..., then ...
  Verify: e2e — ...
```
