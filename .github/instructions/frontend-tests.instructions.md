---
applyTo: "frontend/src/**/__tests__/**,frontend/src/**/*.spec.js,frontend/src/**/*.spec.jsx,frontend/src/**/*.spec.ts,frontend/src/**/*.spec.tsx,frontend/src/**/*.test.js,frontend/src/**/*.test.jsx,frontend/src/**/*.test.ts,frontend/src/**/*.test.tsx,frontend/src/test/**"
---

# Frontend Tests — Rules

How to write a spec: `frontend/src/test/README.md`. These are the rules a spec must
not break. Scope is the frontend jest suite, not `cypress-tests/`.

The thing to catch: **a spec that passes against broken production code.** It
certifies nothing while implying the behaviour is safe. One "spec" here had 6 tests,
zero `expect()` calls, and passed.

Specs are exempt from the TypeScript-only rule in `frontend-typescript.instructions.md`
— a `.spec.js` matches its `.js` source. Do not ask for a spec to be converted.

## 1. Mocking

- **Never reimplement production logic inside a spec.** `jest.mock` is only the most
  obvious form. It counts equally when the copy lives in a local helper
  (`buildMockStore`, `createMockStore`, `makeFakeSlice`), in a `createStore(...)`
  seeded with hand-written state, or inline in the test body. `createStore` itself is
  fine against a **real** slice factory — `createStore(immer(createXSlice))` is the
  endorsed layer-2 pattern, see `_stores/__tests__/appVersionSlice.readOnly.spec.js`.
  The defect is the hand-written copy, not the helper.
  A comment saying the copy "mirrors" production is a confession, not a mitigation:
  the copy asserts nothing about production, and it drifts on the next edit to the
  real function.
- **Never mock or hand-roll the App Builder store to test store behaviour.**
  `jest.mock('@/AppBuilder/_stores/store')`, `createMockStore`, a `createStore(...)`
  filled with hand-written state, or a fake `useStore` object cannot
  observe a cascade, ordering, or timing. Anything about a slice, a
  resolved value, an exposed value, or an event uses the real composed store via
  `seedApp()` / `AppBuilderTestSession` / `createWidgetHarness()`. A pure helper
  reading only a state shape is the one exception.
- **"The real store needs too much setup" is not a reason.** `seedApp()` gets a page,
  components and a live dependency graph in three lines — see
  `_stores/slices/__tests__/integration/validateWidget.spec.js`. A spec that opens by
  justifying a fake store because the composed store is expensive has the cost
  backwards.
- **Fake HTTP only at the MSW boundary** — no `jest.mock` of `@/_services/**`, no
  `global.fetch = jest.fn()`.
- **Assert on the store, never on a mock.** A spec whose only assertion is
  `expect(spy).toHaveBeenCalled()` is testing its own mock.
- Only these may be mocked: **time, IDs, geometry, observers, media, storage,
  edition, and external package adapters.**

## 2. The test must be able to fail

- **A spec must reach the code it covers.** If a spec cannot reach the changed
  production file, it cannot fail when that file breaks, however many assertions it
  carries. Reaching counts three ways — a direct import; importing the real composed
  store `@/AppBuilder/_stores/store`, which reaches every slice; or importing
  `widgetHarness`, which reaches the widget under test. A spec that reaches the changed
  code through **none** of those, because it stands up its own fake instead, is an
  automatic reject. Do not flag an integration or widget spec merely for not naming the
  changed file among its imports — going through the store or the harness is the
  normal, correct shape.
- **Assertions must match the real signature.** Check what the production function
  actually returns before asserting on a return value. A void store action returns
  `undefined`, so `expect(result).toEqual([...])` proves only that some fake in the
  spec returned what the spec told it to. Same for arguments: call the function the way
  the code path under test calls it, or the spec exercises a different branch. **A
  default value on the parameter is not an excuse** — if the call site under test
  passes an argument, the spec must pass it too. Omitting it is correct only where that
  call site itself omits it — or where the spec's subject *is* the function, in which
  case its own default path is a valid case to test.
- **No assertion-free specs.** Zero `expect()` calls in a test body is an automatic reject.
- **No tautological assertions** — `expect(x).toBeDefined()`, asserting a value the
  test itself just set, or asserting only that render did not throw. Each passes
  against arbitrarily broken code.
- **A bug fix ships with a spec that was red before the fix.** If the new spec never
  reaches the changed production line, it was green before the fix too.
- **`.only` must never merge.** A `.skip` needs a rationale at the skip or in the
  file header.
- **`test.failing` is only for a bug deliberately left unfixed**, and must name the
  bug and cite the source location. Never for a bug the same PR fixes. One that goes
  red means the bug is fixed — flip it to `test`.

## 3. Naming and placement (CI-enforced, silently fatal if wrong)

- **Name specs `*.spec.[jt]s(x)`, inside a `__tests__/` directory.** A `*.test.*`
  file, or a `*.spec.*` outside `__tests__/`, is invisible to jest and never runs.
- **Does the spec import the real composed store, `@/AppBuilder/_stores/store`?**
  No → `__tests__/`. Yes → `__tests__/integration/`. Both directions are enforced,
  including a spec in `integration/` that never touches the store.
- Importing `./widgetHarness` counts as importing the store, so **all widget specs
  are integration specs**.
- **The placement question presumes the spec imports what it covers.** A spec about
  store behaviour that imports no store is not a unit spec — it is a broken spec, and
  the layout check cannot see the difference. `npm run test:layout` passing is never
  evidence that a spec is correct; it only proves the file will be collected by jest.
  Check §2's reach rule first, then placement.

## 4. Layer

Write at the lowest layer that can observe the behaviour: pure function → one slice
→ real store + `seedApp()` → RTL. **All timing and ordering behaviour needs the real
store** — that bug class lives between slices, and a mocked store has no timing.
Flag an RTL spec that exists only to reach a pure helper.

## 5. Widget specs

- **Use `createWidgetHarness`** from
  `src/AppBuilder/Widgets/__tests__/integration/widgetHarness.js`. A hand-rolled
  setup silently misses what it handles — most importantly `setEditorLoading(false)`,
  without which `fireEvent` hard-returns (`eventsSlice.js:104`) and every event
  silently does nothing while the spec passes.
- **Assert only on properties and events the widget's schema in
  `src/AppBuilder/WidgetManager/widgets/` actually declares.** A test for a property
  the widget does not have passes while asserting nothing.
- Cover, in priority order: exposed values published; events firing **and the handler
  seeing the new value, not the previous one**; falsy values (`false`, `0`, `''`)
  surviving intact; `{{ }}` bindings.

## 6. Out of scope for unit tests

Cypress owns canvas drag/resize/drop, full Editor/Viewer route flows, multiplayer/yjs,
CodeMirror internals, chart rendering, and pixel layout. Test the math and helpers
behind them instead — do not ask for unit tests of those surfaces.
