---
component_type: ReplaceWithRegisteredComponentType
baseline: lts-3.16
contract_status: researching
development_type: existing-widget
product_approval:
test_design_approval:
research_context7:
research_git_history:
prd_source:
sibling_contracts:
---

# ReplaceWithRegisteredComponentType testing contract

Use the repository `widget-tdd` skill and `frontend/src/test/app-builder/README.md`. For an existing
widget, Context7 and the two-year Git-history review are hard prerequisites. For a new widget,
use an approved GitHub PRD, ClickUp PRD, or Notion PRD instead. This document records the evidence
along with product behavior and approved test seams; it must not restate the implementation.

This contract is finished before the first test is written. It covers the whole registered surface,
or it is not `spec-complete`.

## Disposition grammar

Every row in the four enumeration tables below ends in exactly one of these tokens. Prose is not a
disposition — no `GAP`, no `untested`, no `scenario owed`, no free-text `N/A`. The validator rejects
anything else.

| Token | Meaning |
| --- | --- |
| `covered:<ID>[,<ID>]` | A scenario in this contract covers it |
| `shared:<test path>#<ID>` | A shared layer owns it and is tested there — the test must already exist |
| `qa:<ID>` | Browser-owned; needs a real `Layer: Browser` / `Owner: QA` scenario here |
| `decision:<D-nn>` | Blocked on a product question; `D-nn` must carry an Answer |
| `none:<code>` | Deliberately not covered |

`none:` codes are closed: `computed-css`, `dead-config`, `param-handle`, `seeding-artifact`,
`platform-owned`, `duplicate-of:<ID>`.

## Research findings

Research sources live only in the frontmatter (`research_context7` + `research_git_history` for an
existing widget, `prd_source` for a new one). Do not restate them in prose sections; a second copy
is the one that goes stale.

One row per finding, one disposition token each. A finding left in prose is a coverage hole with a
paper trail.

| Finding | Source | Disposition |
| --- | --- | --- |
|  |  |  |

## Registered-surface disposition

Axis 1. One row per key in the registered definition: every property, style, validation rule, event,
action, and exposed variable, plus every exposed variable the runtime publishes that the definition
omits. Classify layout and styling by what the assertion needs: an inline style a documented
property drives is Engineering; computed CSS, real scroll, focus order, and geometry are `qa:` or
`none:computed-css`.

| Registered key | Kind | Disposition |
| --- | --- | --- |
|  | property / style / validation / event / action / exposed variable |  |

## Production-behavior inventory

Axis 2. A checklist of behavior *kinds*, not of this widget's surface — it never substitutes for
Axis 1.

| Dimension | Evidence or required scenario | Disposition |
| --- | --- | --- |
| Initial/default value and rendering |  |  |
| User interactions and keyboard behavior |  |  |
| Dynamic bindings and property changes |  |  |
| Exposed variables, actions, and events |  |  |
| Validation and Form lifecycle |  |  |
| Loading, disabled, and visibility states |  |  |
| Empty, falsy, invalid, and boundary values |  |  |
| Editor/Viewer consistency |  |  |
| Saved-app compatibility |  |  |
| Accessibility |  |  |
| State precedence (CSA versus property) |  |  |
| Browser-only layout/geometry |  |  |

## Combination matrix

Axis 3, and the reason a wide widget needs roughly as many scenarios as it has keys rather than a
third of that. Cross the state-bearing keys: pairs read by the same runtime branch or handler, a key
that gates another, an action and a property writing the same state, a lifecycle signal arriving
while a non-default property is active, and a falsy or boundary value meeting a feature that
transforms values.

| Combination | Why it can break | Disposition |
| --- | --- | --- |
|  |  |  |

## Existing-test audit

| Existing case | Evidence and required change | Disposition |
| --- | --- | --- |
|  |  | Keep / Rewrite / Move / Delete |

## Decisions

Every ambiguity ends here with an `Answer`. A decision without one blocks `spec-complete`; there is
no parking lot.

### D-01 The question in one line

- Raised by: the row or scenario this blocks
- Recommendation: what was proposed, and the consequence either way
- Answer: the recorded human decision
- Unblocks: scenario IDs the answer made writable, or the `none:` code it settled

## Approved scenarios

Use stable IDs: `<ComponentType>-<FAMILY>-NNN`. Engineering statuses are `proposed`,
`decision-required`, `approved`, `implemented`, `verified`, `harness-blocked`, or `deferred`.
`proposed` and `decision-required` are illegal once the contract is `spec-complete`. Only a human
defers, and `deferred` requires a `Deferred-by` line.

### [ReplaceWithRegisteredComponentType-FAMILY-001] Public behavior guarantee

- Guarantee: State what a user, builder, or consuming app can rely on.
- Sources: Cite independent documentation, configuration, decision, or reproduced regression.
- Layer: Unit / Store contract / RTL integration
- Owner: Engineering
- Public seam: Name the observable entry and result.
- Status: proposed
- Evidence: Add RED, GREEN, sensitivity, and verification only after they exist.

Ranking (Critical/High/Medium/Low) sets implementation order, not scope; keep it in the test's
`// Break this catches:` comment or the PR, not here.

For browser-owned behavior, record only the product contract and classification:

### [ReplaceWithRegisteredComponentType-BRW-001] Browser-only product behavior

- Guarantee: State the product outcome.
- Sources: Cite the independent source.
- Layer: Browser
- Owner: QA
- Status: qa-owned
