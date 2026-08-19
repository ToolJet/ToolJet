# Frontend unit tests

Jest + Babel + Testing Library + MSW. Run from `frontend/`:

```bash
npm test                    # everything
npm run test:watch          # watch mode
npm run test:unit:changed   # only tests related to your uncommitted changes
npm run test:coverage       # with coverage report
npm run test:app-builder:contracts
npm run test:app-builder:parity -- --edition ce
npm run test:app-builder:coverage
npm run test:app-builder:cypress # requires the normal Cypress app/server setup
```

## Conventions

- **Placement**: colocated `__tests__/` directory next to the source file.
  `src/foo/bar.js` → `src/foo/__tests__/bar.test.js`.
- **Naming**: product tests use the existing `.spec.*` convention. Harness
  self-tests under `src/test/` use `.test.*`.
- **Environment**: default is `jest-fixed-jsdom` (jsdom + Node's native fetch,
  required by MSW). Pure-logic suites that must prove they are DOM-free can opt
  into node with a `/** @jest-environment node */` docblock.
- **Mock discipline**: never reimplement production logic inside a `jest.mock`
  factory. App Builder tests use its real composed store and MSW at the HTTP
  boundary; only time, IDs, geometry, observers, media, storage, edition, and
  external package adapters may be controlled.
- **Store reset**: zustand stores are reset automatically after every test
  (`__mocks__/zustand.js` + `resetAllStores()` in `setupTests.js`). Do not
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

## What to use where

| You are testing…            | Use                                                         |
| --------------------------- | ----------------------------------------------------------- |
| Pure functions/helpers      | plain jest, no DOM (consider `@jest-environment node`)      |
| App Builder store behavior  | `AppBuilderTestSession.store.act/read` against the real composed store |
| `src/_services/**`          | MSW: `import '@/test/setupMsw'`, add handlers with `server.use()`, seed auth with `seedSession()` |
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
