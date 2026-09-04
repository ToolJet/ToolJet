---
name: widget-tdd
description: Research, grill, approve, and implement complete ToolJet App Builder widget test coverage. Use before adding or changing tests for a registered widget; excludes QA-owned Cypress implementation.
---

# Widget TDD

Build regression protection from an approved product contract that covers the widget's **whole**
registered surface. Never infer correctness from the current implementation, an existing test, or
coverage alone.

The contract is finished before any test is written. A contract that covers part of the surface is
not a milestone, it is an unfinished contract.

## Non-negotiables

1. **No prose dispositions.** Every table row ends in one of the five disposition tokens below.
   There is no "GAP", no "untested", no "scenario owed", no free-text `N/A`. Those were how this
   workflow used to certify its own holes.
2. **One approval, whole widget.** You present the complete scenario set once. You do not ship a
   slice and leave the rest for a later approval round; that ratchet is never finished.
3. **A question ends in an answer.** Ambiguity becomes a decision with a recorded **Answer** in the
   contract. "Open decision", "decision-required", and "parked" are not terminal states.
4. **Three axes, not one.** Registered keys, behavior dimensions, *and* combinations. Most missed
   bugs live in the crossings.

## Required context

Read these before acting:

- `frontend/CONTEXT.md`
- `frontend/src/test/app-builder/README.md`
- `frontend/widget-testing-manifest.json`
- `frontend/src/test/app-builder/widgets/TESTING.template.md`
- the selected widget's manifest-linked `TESTING.md`, when present
- **every already-approved sibling contract** under `frontend/src/test/app-builder/widgets/`
- the repository [grill-me skill](../grill-me/SKILL.md) for the questioning protocol
- The contract's research source: existing widgets require Context7 official ToolJet docs
  (`npx ctx7@latest library` then `docs`, per the repo Context7 rule; the MCP when wired) and two-year
  Git history; new widgets require an approved GitHub, ClickUp, or Notion PRD.

The canonical baseline is `lts-3.16`.

## Disposition grammar

Every row in **Research findings**, **Registered-surface disposition**, **Production-behavior
inventory**, and **Combination matrix** ends in exactly one token. The validator rejects anything else, including prose that looks
reasonable.

| Token | Meaning | Machine check |
| --- | --- | --- |
| `covered:<ID>[,<ID>]` | This contract carries a scenario for it | Each ID exists as a scenario section here |
| `shared:<test path>#<ID>` | A shared layer owns it and is tested there | The file exists and contains that ID |
| `qa:<ID>` | Browser-owned | The ID exists here with `Layer: Browser` and `Owner: QA` |
| `decision:<D-nn>` | Blocked on a product question | `D-nn` exists in `## Decisions` **with an Answer** |
| `none:<code>` | Deliberately not covered | `<code>` is from the closed reason-code list |

Closed reason codes for `none:`: `computed-css`, `dead-config`, `param-handle`, `seeding-artifact`,
`platform-owned`, `duplicate-of:<ID>`. A reason outside this list means editing the validator, which
is a human decision on purpose. Never invent a code to clear a row.

`shared:` must point at a test that **exists**. "Owed one test at that layer" is not a disposition —
if the shared test does not exist yet, the row is `decision:` until someone decides who writes it.

## Phase 1 — Research

1. Identify the registered `componentType`; never derive it only from a filename.
2. Set `development_type` to `existing-widget` or `new-widget`.
3. Research using the matching branch:
   - `existing-widget`: Context7 for official ToolJet widget documentation, plus the last 2
     years of Git history for bugs and regressions. Record both. If Context7 is unavailable,
     stop and ask for installation/configuration.
   - `new-widget`: an approved product PRD from GitHub, ClickUp, or Notion. Record its URL or
     identifier in `prd_source`; do not require Context7 or Git history that do not exist yet.
4. Inspect public documentation, the registered widget definition, the runtime, regression history,
   the shared harness, and every overlapping active test.
5. Reconcile documentation, registration, and runtime against each other. Each of these is a
   mismatch and becomes a row: documented but not implemented; registered but not read by the
   runtime; implemented but undocumented; registered on the widget but implemented one layer up
   (`RenderWidget`, `Container`).
6. Classify each existing test as keep, rewrite, move, delete, or `decision:`. Passing tests carry
   no presumption of value.
7. Record findings as a table, one row per finding, each ending in a disposition token.

## Phase 2 — Enumerate all three axes

Complete all three tables before writing a single scenario. Enumeration is cheap; a missed axis is
the whole defect this workflow exists to prevent.

### Axis 1 — Registered surface

Every key in the registered definition: each property, style, validation rule, event, action, and
exposed variable, plus every exposed variable the runtime publishes that the definition omits. One
row each, one disposition token each.

Classify layout and styling by what the assertion needs, not by topic. An inline style a documented
property drives is Engineering. Computed CSS, real scroll and overflow, focus order, and geometry
are `qa:`. Do not send a documented property's observable contract to the browser lane because it is
"styling".

### Axis 2 — Behavior dimensions

The template's dimension table. It is a checklist of behavior *kinds*, not of this widget's surface,
so it never substitutes for Axis 1. Mark each with any legal token (`qa:` and `shared:` included).

Always evaluate **state precedence** wherever the widget pairs a `setX` client-side action with an
`xState` property: the action must survive an unrelated property re-resolve and a no-op rewrite of
its own property. This class recurs across every stateful ToolJet widget and no other dimension
names it.

### Axis 3 — Combination matrix

Cross the state-bearing keys against each other. This axis is why a 38-key widget needs roughly 40
scenarios rather than 14 — single-key coverage does not find the crossings, and the crossings are
where the reported bugs are.

Enumerate at minimum every pair where:

- both keys are read by the same runtime branch or the same handler;
- one key gates the other (a limit against a selector, a mode against a filter);
- a client-side action and a property write the same state;
- a lifecycle signal (Form submit, Form clear, options reload) lands while a non-default property is
  active;
- an empty, falsy, or boundary value meets a feature that transforms values.

Give every crossing a disposition token. `none:duplicate-of:<ID>` is the right token for a crossing
an existing scenario already exercises end to end.

### Sibling cross-check

Diff this widget's three tables against every already-approved sibling contract. A key or crossing
disposed in a sibling must be disposed here too, with the same token or a recorded reason for
differing. Record the sibling paths in `sibling_contracts`. Re-litigating a sibling's row from zero
is how `onSearchTextChanged`, `onFocus`, `onBlur`, `optionsLoadingState`, and `icon` stayed uncovered
in two contracts at once.

## Phase 3 — Grill to answers

Set `contract_status: grilling`. Research repository facts instead of asking. For everything that
research cannot settle — product behavior, a documentation/runtime conflict, a dead-looking
configuration key, an affordance with no accessible name — use the linked `grill-me` skill.

For each decision: ask **one** question at a time, state a recommendation and its consequence, wait
for the answer, and make no test or production change until the answer is recorded. If skill
discovery is unavailable, apply that protocol inline.

Record every one in `## Decisions`:

```
### D-01 <the question in one line>

- Raised by: <the row or scenario that is blocked>
- Recommendation: <what you proposed and why>
- Answer: <the human decision, verbatim in substance>
- Unblocks: <scenario IDs the answer made writable, or none:<code>>
```

A decision without an `Answer:` line blocks `spec-complete`. That is the point: the parking lot is
gone.

## Phase 4 — Write the complete scenario set

1. Translate every `decision:` that now has an Answer, and every dimension and crossing not
   dispositioned `none:` or `shared:`, into explicit scenarios. Do not bundle independently
   meaningful public behaviors to reduce the scenario count.
2. Rank each Critical, High, Medium, or Low from user impact, frequency, recoverability,
   compatibility risk, and regression evidence. Ranking sets implementation **order**, never scope.
3. Mark browser scenarios only with `Layer: Browser` and `Owner: QA`. Do not implement or prescribe
   Cypress in this workflow. A `qa:` disposition requires a real scenario section here — QA work
   with no written contract is work that disappears.
4. Behavior a widget declares but a shared layer implements (`RenderWidget`, `Container`, the
   validation slice) is tested once at that layer and referenced with `shared:`. If that test does
   not exist, the row is `decision:` — do not copy the behavior into each widget's spec, and do not
   record it as owed.
5. Set `contract_status: spec-complete` only when every row in all three tables carries a legal
   token, every `decision:` has an Answer, every `covered:`/`qa:` ID resolves, every `shared:`
   pointer resolves to a real test, and no scenario is `proposed` or `decision-required`.
6. Present the complete set for approval and **stop**. Product behavior and test design require
   recorded human approval; an agent cannot approve either field. Changing an approved behavior
   returns the contract to `grilling`.

Do not bulk-create empty contracts. A manifest `not-started` entry is the honest backfill state.

## Phase 5 — TDD

Start only when the contract is `approved`. Implement each approved engineering scenario with the
repository [test-driven-development](../test-driven-development/SKILL.md) skill and its
[writing-good-tests](../test-driven-development/writing-good-tests.md) reference. That skill owns
RED/GREEN, characterization, oracles, sensitivity faults, and `// Break this catches:`. Do not
restate the loop here.

Widget constraints the TDD skill does not know:

1. Co-locate widget-specific tests under the widget's runtime directory, not the shared
   `frontend/src/AppBuilder/Widgets/__tests__/` directory. Real-store/RTL integration tests go to
   `frontend/src/AppBuilder/Widgets/<WidgetDirectory>/__tests__/integration/<ComponentType>.spec.jsx`.
2. Implement **every** approved engineering scenario. Critical and High go first — execution order,
   not a stopping point. The only legal way to stop early is a scenario the user explicitly defers,
   recorded as `Status: deferred` with a `Deferred-by:` line naming who deferred it and when. An
   agent cannot defer. `test.skip` is `deferred` and needs that line the same day; a skipped test
   with a `verified` scenario is a contract that lies.
3. Give every maintained test the approved scenario ID at the start of its behavior-focused title.
   The validator matches the title position only (`test('[ID] ...`), never a comment or a
   `describe` block.
4. Use the scenario's one approved primary seam. Add another layer only for a different failure mode.
5. Keep ToolJet-owned stores, resolvers, hooks, services, providers, and child components real.
   Control only true boundaries documented by the scenario: network, time, IDs, browser geometry,
   observers/media, storage, edition selection, or third-party systems.
6. If the public seam is unavailable, mark `harness-blocked`. Do not inject private contexts, mock
   internal providers, or downgrade the test. Approve and add the harness capability first.
7. When the user rejects or reverts a production fix, keep a live **characterization** test (TDD
   skill) and record the rejection in `## Decisions`. Do not skip it unless they also defer it.

## Completion gate

A test that fails the TDD skill's checklist is not `verified`, even if the scenario ID is in the
title. Do not set `contract_status: verified` while any scenario is `proposed`, `decision-required`,
`approved`, `implemented`, or `harness-blocked`. Every engineering scenario must be `verified` or
`deferred`, and every browser scenario `qa-owned`.

Report partial-scope delivery as partial, naming the deferred scenario IDs and who deferred them.

Record the applicable research source (Context7 plus two-year Git history for existing widgets,
or approved PRD for new widgets) alongside focused RED/GREEN or characterization evidence,
sensitivity result, related suite, test-layout, applicable CE/EE lanes, warnings, unrun lanes, and
the decision log. Update scenario and manifest status only to what this evidence proves. Run
`npm --prefix frontend run validate:widget-testing-contracts` and read its coverage ledger: it
prints scenario and disposition counts per widget so a thin contract is visible instead of implied.
