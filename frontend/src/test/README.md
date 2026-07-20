# Frontend unit tests

Jest + @swc/jest + Testing Library + MSW. Run from `frontend/`:

```bash
npm test                    # everything
npm run test:watch          # watch mode
npm run test:unit:changed   # only tests related to your uncommitted changes
npm run test:coverage       # with coverage report
```

## Conventions

- **Placement**: colocated `__tests__/` directory next to the source file.
  `src/foo/bar.js` → `src/foo/__tests__/bar.test.js`.
- **Naming**: `.test.js` / `.test.jsx` / `.test.ts` / `.test.tsx`. Nothing else
  is picked up (`testMatch` enforces this).
- **Environment**: default is `jest-fixed-jsdom` (jsdom + Node's native fetch,
  required by MSW). Pure-logic suites that must prove they are DOM-free can opt
  into node with a `/** @jest-environment node */` docblock.
- **Mock discipline**: never reimplement production logic inside a `jest.mock`
  factory — the test ends up validating the mock. Mock at module boundaries
  (`@/_services`, store selectors) and assert on real code.
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
| Zustand stores/slices       | `useStore.getState().action()` + assert on `getState()` — no React needed |
| `src/_services/**`          | MSW: `import '@/test/setupMsw'`, add handlers with `server.use()`, seed auth with `seedSession()` |
| Components                  | `render` from `@/test/test-utils` (router + breadcrumb included), `jest.mock('@/_services')` for data |

Shared pieces:

- `@/test/test-utils` — custom `render` (MemoryRouter + BreadCrumbContext), re-exports all of Testing Library plus `userEvent`.
- `@/test/setupMsw` — opt-in MSW lifecycle for HTTP-layer suites.
- `@/test/msw/server` — the MSW server; register durable handlers in `@/test/msw/handlers/`.
- `@/test/factories` — deterministic data builders (`buildSession`, `seedSession`, `buildApp`, `buildUser`). Add new factories here, fixed values only, no randomness.
- `src/test/__tests__/infra.test.js` — self-test for all of the above; if it fails, fix the infrastructure before trusting any other suite.

## What NOT to unit test

Owned by the Cypress suites (`cypress-appbuilder.yml`, `cypress-platform.yml`,
`cypress-marketplace.yml`): canvas drag/resize/drop interactions, full
Editor/Viewer route flows, multiplayer/yjs realtime, CodeMirror internals,
chart/plotly rendering, pixel layout. Unit-test the math/helpers behind those
surfaces instead (see `AppCanvas/Grid/helpers/__tests__`).

## Coverage ratchet

CI runs the full suite on pushes to develop and nightly, then
`npm run coverage:ratchet` compares per-directory coverage against the
committed `coverage-baseline.json`. Coverage may only go up: if your PR drops
a tracked directory by more than 0.5pp, add tests. After landing a wave of new
tests, bump the baseline with `npm run coverage:ratchet:update` and commit it.
