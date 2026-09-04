# App Builder test contract

Use this contract before adding or changing tests for `frontend/src/AppBuilder/**`. The goal is
meaningful regression protection, not test volume or line coverage by itself.

## Widget contract gate

Before adding or changing a registered widget test, use the repository `widget-tdd` skill and check
`frontend/widget-testing-manifest.json`. Research creates the canonical contract at
`frontend/src/test/app-builder/widgets/<ComponentType>/TESTING.md`; do not bulk-create empty files.

TDD cannot begin until product behavior and test design have recorded human approval. Every maintained
widget test starts its title with an approved scenario ID. New widget definitions and modified widget
tests fail validation without an approved contract; untouched widgets remain a report-only backfill.
Run `npm --prefix frontend run validate:widget-testing-contracts`.

For unresolved product behavior, use the repository [`grill-me`](../../../../.agents/skills/grill-me/SKILL.md)
skill: research facts first, then ask one decision at a time with a recommendation and wait for
explicit confirmation. If skill discovery is unavailable, follow the same one-question protocol
inline; do not guess.

## Mandatory research gate

Research is required before writing or modifying widget tests:

1. Classify the work as `existing-widget` or `new-widget` in the contract.
2. For `existing-widget`, use Context7 for official ToolJet widget documentation and inspect Git
   commits from the last 2 years for bugs, regressions, fixes, and behavior changes. If Context7
   is unavailable, stop and ask the agent or engineer to install/configure it first.
3. For `new-widget`, use an approved product PRD from GitHub, ClickUp, or Notion. This replaces the
   Context7 and Git-history prerequisites because no released widget docs or history exists yet.
4. Record the applicable source and findings in the widget's canonical `TESTING.md` before proposing
   scenarios.

The validator requires both research fields on every approved contract.

Browser scenarios are classified `Layer: Browser` and `Owner: QA`. Engineers do not implement or
prescribe Cypress in this workflow.

## Evidence before code

For the behavior under test, record:

1. the outcome a user, builder, or consuming app relies on;
2. an independent source such as public documentation, registered configuration, an approved product
   decision, or a reproduced regression;
3. the failure mode and affected App Builder execution surfaces;
4. the lowest stable public seam and real first-party collaborators exercised; and
5. the disposition of overlapping tests: keep, rewrite, move, or delete.

Current runtime behavior alone is not a product contract. If the expected outcome is ambiguous, stop
and request a product decision, then record it as an answered `D-nn` entry in the widget contract's
`## Decisions` section — an unanswered decision blocks `spec-complete`. Do not append coverage merely
because an existing test is difficult to assess.

Contract tables carry disposition tokens, never prose: `covered:<ID>`, `shared:<test path>#<ID>`,
`qa:<ID>`, `decision:<D-nn>`, or `none:<closed reason code>`. See
`widgets/TESTING.template.md` and run `npm run validate:widget-testing-contracts`.

## Supported seams

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

## Widget integration workflow

Before changing a widget spec, inspect its public documentation, registration under
`AppBuilder/WidgetManager/widgets/`, runtime implementation, regression history, the shared
`Widgets/__tests__/integration/widgetHarness.js`, and every overlapping test. Read the manifest-linked
widget contract containing facts that must not be generalized to other widgets.

Name a test as a public guarantee. Arrange through builders or supported harness seeding, act through
an accessible user interaction or public component action, and assert a semantic DOM or public
store/action result. Let `AppBuilderTestSession` own rendering and cleanup.

For existing behavior, prove characterization sensitivity with a targeted fault. For new behavior or
bug fixes, capture red before production code and then make the smallest green change. Report the
focused command and result, `npm --prefix frontend run test:layout`, applicable CE/EE or Cypress lanes,
the sensitivity result, warnings, unrun lanes, and unresolved product decisions.
