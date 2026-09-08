# App Builder testing

The goal is meaningful regression protection with a workflow developers can use for everyday changes.

## Choose the task

| Task | Entry skill | Example |
| --- | --- | --- |
| Existing widget coverage | [Widget backfill](../../../ee/.agents/skills/app-builder-widget-backfill/SKILL.md) | “Backfill Cascader clear/reset” or “Audit the whole Button widget” |
| Defect anywhere in App Builder | [Bug fix](../../../ee/.agents/skills/app-builder-bugfix/SKILL.md) | “Fix queries rerunning across modules” |
| New/changed capability anywhere in App Builder | [Feature](../../../ee/.agents/skills/app-builder-feature/SKILL.md) | “Add query cancellation” or “Build a new widget” |

These are the only three developer-facing testing skills. They load the same
[test design and verification](../../../ee/.agents/skills/app-builder-testing/test-design-and-verification.md),
[quality guide](../../../ee/.agents/skills/app-builder-testing/writing-good-tests.md),
[conventions](../../../ee/.agents/skills/app-builder-testing/conventions.md), and
[product-decision protocol](../../../ee/.agents/skills/app-builder-testing/product-decisions.md).
Read `frontend/CONTEXT.md` for repository context. Research facts first; ask only for unresolved
product behavior. Accepted requirements/session decisions permit work followed by normal PR review,
without a separate pre-implementation test-design approval.

All three workflows require [plan grilling](../../../ee/.agents/skills/app-builder-testing/test-design-and-verification.md#stress-test-the-proposed-test-plan-required)
after drafting scenarios and before implementation. The agent challenges correctness, omissions,
false confidence, test boundaries, and scope; revises weaknesses; and records a short note beside
the design. Only unresolved product decisions become user questions, one at a time. This is separate
from the final review of implemented tests and does not replace executed regression sensitivity.

## Scope and evidence

Backfill can be focused or whole-widget. Bug fixes/features anywhere in App Builder cover their
changed guarantees and affected interactions; they do not require unrelated widget backfill.
Entirely new widgets need the full intended surface defined from accepted requirements.

Widget-specific guarantees and executed evidence live in the manifest-linked canonical
`frontend/ee/test/app-builder/widgets/<ComponentType>/TESTING.md`, using `TESTING.template.md` there.
Follow the shared [widget contract reference](../../../ee/.agents/skills/app-builder-testing/widget-contracts.md).
Manifest `status` and matching `contract_status` describe whole-widget progress. A focused contract
can contain verified scenarios while both remain `not-started`. New scenarios use
`ready → implemented → verified`; existing approval records remain historical facts.
For other App Builder changes, keep durable guarantees in tests and sources, design, scope, and
executed evidence in the PR or a ready-to-paste PR handoff. No extra contract system is required.

Record Guarantee, Sources, Public seam, Setup, Action, and Fault before code. Challenge no-ops,
competing values, and alternate paths; assert counts for “once.” Name each test's break with
`// Break this catches:`. Use literal independent expectations and keep relevant ToolJet collaborators real.

Existing behavior requires PASS → realistic fault → intended assertion FAIL → restore → PASS.
Bugs/features require behavioral FAIL → implementation → PASS. Record the actual revision,
commands, pre-fix behavior/fault, failed assertion and restored/GREEN result once per run, linked
by scenario ID. Passing tests without demonstrated sensitivity remain `implemented`.

## Supported test seams

- Pure Jest: exported deterministic product API, with an independent semantic oracle.
- Store integration: real composed store via `AppBuilderTestSession.store.act` and `store.read`.
- RTL: smallest production UI with real providers, stores, resolvers, bindings/events, and
  `RenderWidget` where integration is the guarantee. Session owns rendering and cleanup.
- Browser: QA owns real geometry, computed CSS, focus order, persistence, routing and complete
  cross-surface journeys. Record explicit Browser / QA scenarios; assignment is not verification.

Control true boundaries only: HTTP through MSW, time, generated IDs, browser observers/media/geometry,
storage, edition selection, documented third-party systems. The `capabilities.dnd` option mounts
production's real `DndProvider`; enable it for Form/ListView children instead of injecting contexts.
Use supported builders and seeding, accessible queries, and realistic user interactions. Do not
mock App Builder modules, services, stores, selectors, hooks or child components; do not use raw
singleton mutations, fixed sleeps, private call-order assertions or ungrounded snapshots.
An unavailable public seam is `harness-blocked`; improve the harness before claiming coverage.

## Commands and gates

Run commands from the repository root:

```sh
npm --prefix frontend test -- --runInBand --runTestsByPath <frontend-relative-spec-path>
npm --prefix frontend run test:layout
npm --prefix frontend run validate:widget-testing-contracts
npm --prefix frontend run validate:widget-testing-contracts -- --base-ref <local-base-ref>
npm --prefix frontend run test:app-builder -- --runInBand --edition=ce
npm --prefix frontend run test:app-builder -- --runInBand --edition=ee
```

Use focused tests during implementation, then related suites and applicable edition lanes.
The plain validator command checks recorded contracts; `--base-ref` also checks changed widget
statements, including deleted assertions and local untracked tests. The ref must exist locally.
CI uses newline-delimited JSON PR file records (`status`, `path`, `patch`, `additions`, `deletions`).
Missing/truncated patches fail with an instruction to obtain a reliable base comparison. Legacy
TSV input remains readable but cannot establish a modified test's scope without patch evidence.

Added/changed widget declarations need ready scenario IDs. Untouched legacy tests do not need
conversion. Shared setup changes require review/rerun of the affected suite; file-level helper
changes affect all its tests. Imported helper changes need caller review too; diff selection is not
a dependency analysis. New widgets require `spec-complete` intended scope, without an approval ceremony.

Structural checks reject missing references/evidence, focused tests, disabled tests presented as
implemented, and incomplete whole-widget verification. They cannot prove assertion quality,
source authenticity, complete registered-key coverage, or actual execution. Reconcile the inventory
and full relevant run before claiming whole-widget verification; deferred/harness-blocked engineering
work prevents that claim. Report QA work separately. Preserve useful legacy regression coverage.

Resolve unexpected HTTP/console errors, including caught MSW failures. Narrow pre-existing warning
allowances need owner/reason; never broadly suppress output. Report warnings and unrun lanes honestly.
Private EE contracts must exist: absence is a failure. The frontend CI job currently does not check
out the private EE submodule; that access/setup issue remains a rollout blocker, not a reason to skip validation.
