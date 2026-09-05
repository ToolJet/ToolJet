# Frontend unit tests

Jest + Babel + Testing Library + MSW. Run from `frontend/`:

```bash
npm test                    # everything
npm run test:watch          # watch mode
npm run test:coverage       # with coverage report
npm run test:app-builder:contracts
npm run test:app-builder:parity -- --edition ce
npm run test:app-builder:coverage
npm run test:app-builder:cypress # requires the normal Cypress app/server setup
```

## Conventions

- **Placement**: colocated `__tests__/` directory next to the source file.
  Unit specs sit directly in it, integration specs in an `integration/`
  subdirectory — see **Where a test goes** below.
- **Naming**: `*.spec.[jt]s(x)` — one convention everywhere, product tests and
  harness self-tests alike. A file named `*.test.*` is NOT picked up by
  `testMatch` and will silently never run. A unit spec is named after the source
  file it covers (`ast.js` → `ast.spec.js`); when one module needs several specs,
  qualify it (`utils.resolver.spec.js`, `utils.debounce.spec.js`). An integration
  spec is named after the behaviour it covers, because it spans several modules
  (`exposedValueCascade.spec.js`, `pageSwitch.spec.js`).
- **Environment**: default is `jest-fixed-jsdom` (jsdom + Node's native fetch,
  required by MSW). Pure-logic suites that must prove they are DOM-free can opt
  into node with a `/** @jest-environment node */` docblock.
- **Bug fix workflow — a fix needs a test that failed first**: when a bug is
  reported, reproduce it as a normal `test` asserting the CORRECT behaviour
  before you fix anything. It goes red, you fix the bug, it goes green. No
  `test.failing`, no flipping — that inversion is only for bugs we are
  deliberately NOT fixing yet. Every bug fix PR should carry a test that was red
  before the fix and green after; that is what proves the fix works and locks the
  bug out permanently. See **Bug fix workflow** below.
- **Known bugs — `test.failing`**: a bug we have found but not fixed is written
  as `test.failing(...)`, which INVERTS the usual meaning. While the bug exists
  the test fails, and jest reports the suite **green**. The day someone fixes
  the bug the test starts passing, and jest reports it **red**.
  **If a `test.failing` turns red, you did not break anything — you fixed the
  bug. Change `test.failing` to `test` and keep your fix.** This keeps CI
  honest (no permanently-red suite that everyone learns to ignore) while still
  telling us the moment a bug is gone. Two caveats: `test.failing` passes when
  the test fails for *any* reason, so it is a weaker signal than a normal
  assertion; and every one of them must name the bug and cite the source
  location in a comment, or it is unmaintainable.
- **Mutation-verify every test**: before you commit a test, break the line of
  production code it covers, confirm THAT test fails, then restore. A test that
  still passes against broken code is worse than no test — it certifies
  nothing while implying coverage.
- **Mock discipline**: never reimplement production logic inside a `jest.mock`
  factory. App Builder tests use its real composed store and MSW at the HTTP
  boundary; only time, IDs, geometry, observers, media, storage, edition, and
  external package adapters may be controlled.
- **Store reset**: zustand stores are reset automatically after every test
  (`__mocks__/zustand.js`'s `__resetAllStores()`, called from `setupTests.js`). Do not
  hand-roll `setState({}, true)` cleanup in tests.
- **ESM packages**: if a test fails with `SyntaxError: Cannot use import
  statement outside a module`, add the offending package to `esmPackages` in
  `jest.config.js`.
- **Assets**: plain `.svg` imports resolve to a renderable mock React component
  (SVGR parity — works the same under webpack and rspack); `.svg?url` and
  binary assets (png/fonts/wasm…) resolve to the string `'test-file-stub'`.
- **Editions**: `@ee/*` resolves to the real `ee/` submodule when present,
  `src/modules/emptyModule` otherwise; `@cloud/*` always maps to emptyModule.
  Run `TOOLJET_EDITION=ce npm test` to exercise CE resolution on an ee checkout
  (same replacement the bundlers do via NormalModuleReplacementPlugin).

## Bug fix workflow

A bug report is the cheapest possible test case: someone has already done the
work of finding a reproducible failure. Capture it before fixing it.

```
Bug reported  ->  write a normal test asserting the CORRECT behaviour
              ->  it fails (RED) — this proves you reproduced the bug
              ->  fix the production code
              ->  it passes (GREEN) — this proves the fix works
              ->  ship both together
```

Rules:

1. **Every bug fix PR includes a test that was red before the fix.** If the test
   passes before you touch the production code, you have not reproduced the bug
   and you do not yet know what you are fixing.
2. **Do not use `test.failing` for a bug you are fixing now.** A plain `test` is
   simpler: red then green, no inverted logic and nothing to flip afterwards.
   `test.failing` exists only for bugs we are deliberately deferring.
3. **A deferred bug gets `test.failing` plus a linked issue.** The suite stays
   green, and CI tells us the moment someone fixes it.
4. The count of `test.failing` entries should trend towards zero. Growth means
   we are accumulating known-broken behaviour, which is a signal worth raising.

The audit that seeded this suite produced a one-time backlog of `test.failing`
entries. Rule 1 is what stops a new backlog from forming.

## Where a test goes

There is exactly **one** question, and it is mechanically checkable:

> Does the spec import the real composed store, `@/AppBuilder/_stores/store`?

| | Answer | Lives in | Run with |
| --- | --- | --- | --- |
| **Unit** | no | `__tests__/` | `npm run test:unit:only` |
| **Integration** | yes | `__tests__/integration/` | `npm run test:integration` |

```
src/AppBuilder/_stores/
  ast.js
  __tests__/
    ast.spec.js                     <- unit: pure function, no store
    integration/
      exposedValueCascade.spec.js   <- integration: real store, several slices
```

`npm run test:layout` enforces this and **runs in CI before the suite**, because a
misfiled or `*.test.*` spec silently never runs — which reports green while
testing nothing. It also catches the inverse (a spec in `integration/` that does
not use the store).

Note that `jest.mock('@/AppBuilder/_stores/store', …)` does **not** make a spec
an integration test — stubbing the store is the opposite of exercising it, and
such a spec stays a unit spec.

Prefer the lowest layer that can observe the behaviour:

1. **Pure function** — no store, no DOM, zero mocks. Cheapest and most durable.
2. **One slice in isolation** — `createStore(immer(createXSlice))`. See
   `appVersionSlice.readOnly.spec.js`.
3. **Integration, real store** — for anything crossing slices, and for ALL
   timing/ordering behaviour. `seedApp()` from `@/test/app-builder` gets you a
   page, components and a live dependency graph in the correct order.
4. **RTL** — only when the DOM is genuinely the thing under test.

Layer 3 is not optional for timing bugs. The "event fired but the handler read
the previous value" class exists *between* slices, so mocking the store makes it
untestable by construction.

## What to use where

| You are testing…            | Use                                                         |
| --------------------------- | ----------------------------------------------------------- |
| Pure functions/helpers      | plain jest, no DOM (consider `@jest-environment node`)      |
| App Builder store behavior  | `AppBuilderTestSession.store.act/read` against the real composed store |
| `src/_services/**`          | MSW: `import '@/test/setupMsw'`, add handlers with `server.use()` |
| Components                  | `render` from `@/test/test-utils` when routing is needed; add feature providers explicitly |

Shared pieces:

- `@/test/test-utils` — custom `render` with `MemoryRouter`; re-exports all of Testing Library plus `userEvent`.
- `@/test/setupMsw` — opt-in MSW lifecycle for HTTP-layer suites.
- `@/test/msw/server` — the MSW server; register durable handlers in `@/test/msw/handlers/`.
- `@/test/app-builder` — App Builder Scenario contract, builders, deterministic controls, store/RTL session, and domain assertions.
- `src/test/__tests__/infra.test.js` — self-test for all of the above; if it fails, fix the infrastructure before trusting any other suite.

## What NOT to unit test

Owned by the Cypress suites (`cypress-appbuilder.yml`, `cypress-platform.yml`,
`cypress-marketplace.yml`): canvas drag/resize/drop interactions, full
Editor/Viewer route flows, multiplayer/yjs realtime, CodeMirror internals,
chart/plotly rendering, pixel layout. Unit-test the math/helpers behind those
surfaces instead (see `AppCanvas/Grid/helpers/__tests__`).

## Coverage reporting

`app-builder-coverage-manifest.json` assigns every eligible App Builder source
file to one of the ten approved subsystems. Validate it with
`npm run validate:app-builder-coverage-manifest`. `npm run
test:app-builder:coverage` writes edition-separated output under
`coverage/app-builder/<ce|ee>/jest`. During adoption CI publishes these numbers
without a threshold; the manifest target is intentionally `report-only`.

Compatibility fixtures live under `test-resources/app-builder/compatibility`.
Every fixture must be declared in the manifest with schema, provenance,
edition applicability, oracle, and SHA-256. The loader fails closed on drift.
