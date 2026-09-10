# App Builder test contract

The goal is meaningful regression protection for `frontend/src/AppBuilder/**`.

## Workflow entry

Before adding or changing registered widget tests, use
[Widget TDD](../../../ee/.agents/skills/app-builder-widget-tdd/SKILL.md) for phases and completion.
It selects research, decisions, test execution, and resumption from `frontend/widget-testing-manifest.json`.
Canonical contracts live in the EE submodule; untouched widgets remain queued in the manifest.

## Validation commands

Run from the repository root with both contract statuses set to the candidate next state:

| Purpose | Command |
| --- | --- |
| Planning/reapproval design audit | `npm --prefix frontend run validate:widget-testing-contracts -- --design-only` |
| Full local validation | `npm --prefix frontend run validate:widget-testing-contracts` |
| Final delivery | `npm --prefix frontend run validate:widget-testing-contracts -- --base-ref <implementation-start-revision>` |

All modes discover staged, unstaged, and untracked changes; the default base is HEAD. Design mode
validates the contract and reports delivery scope blockers without failing for those blockers alone.
It permits design review with retained edits. Full validation requires approvals and allowed delivery
scope. Use the saved implementation base on resumptions and at delivery; it can also be supplied to
design mode. A missing/invalid ref or failed Git discovery is an error in every mode.

CI uses `--changed-files-stdin` with GitHub `status<TAB>path` entries (or plain modified paths), one
per line. Explicit stdin replaces local discovery, including an explicitly empty list; stdin and
`--base-ref` are mutually exclusive. Local rename detection is disabled so removal and addition both count.

The ledger separates Engineering verification, deferrals, QA ownership, and exclusions. Validation
checks structure and recognized widget runtime/registration scope. Widget TDD's completeness audit
owns evidence truth, semantic coverage, and manual review of shared/harness scope.

## Supported seams

Before creating a spec, follow the placement and naming conventions in
[Frontend unit tests](../README.md#conventions): `*.spec.[jt]s(x)`, with Unit specs directly in the
colocated `__tests__/` directory and integration specs in its `integration/` subdirectory.

- Pure Jest calls an exported deterministic product API.
- Store integration uses the real composed App Builder store through `AppBuilderTestSession.store.act`
  and `store.read`.
- RTL renders the smallest production UI boundary with real providers, store, resolver, bindings,
  events, and `RenderWidget` where widget integration is the behavior.
- Contract tests use immutable inputs and an independent semantic oracle.
- Cypress owns complete browser journeys, real geometry and computed CSS, routes, persistence,
  access, Editor/Viewer transitions, and cross-surface behavior.

Control only genuine boundaries when needed: HTTP through MSW, time, generated IDs, browser geometry,
observers/media, storage, edition selection, and documented third-party adapters. `capabilities.dnd`
is the one provider capability: it mounts the REAL react-dnd `DndProvider` that `AppBuilder.jsx`
supplies in production, which `AppCanvas/Container` requires — any widget rendered as a
sub-container child (a Form field, a ListView row) throws `Expected drag drop context` without it.
Enable it instead of injecting a container's context by hand. Do not mock App
Builder modules, services, stores, selectors, hooks, or child components. Do not use raw store
mutation, direct singleton-store reads in test bodies, fixed sleeps, generated CSS selectors when a
public query exists, internal call-order assertions, or snapshots without an approved oracle.

## Writing an integration test

Inspect the registered definition, runtime, shared harness, and overlapping tests identified by the
approved contract. Arrange through builders or supported harness seeding, act through an accessible
interaction or public component action, and assert semantic DOM or public store/action results.
Let `AppBuilderTestSession` own rendering and cleanup. Prefix every maintained title with its approved
scenario ID and follow that scenario's primary seam. Scenario scope and verification evidence remain
in the canonical contract, not copied into shared workflow instructions.
