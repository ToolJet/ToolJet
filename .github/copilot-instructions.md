# ToolJet — Shared Copilot Instructions

## Styling

- Tailwind classes MUST use the `tw-` prefix (e.g., `tw-flex`, `tw-text-default`). Unprefixed Tailwind is a bug.
- NEVER hardcode hex/rgb colors. Use CSS variable tokens via Tailwind (`tw-text-default`, `tw-bg-page-default`) or `var(--text-default)`.
- Prefer Tailwind over Bootstrap for new code. Do not extend legacy `react-bootstrap` usage.
- Use custom typography utilities (`tw-font-title-default`, `tw-font-body-default`, etc.) instead of ad-hoc font-size/weight.
- Design tokens: `frontend/src/_styles/designtheme.scss` + `frontend/tailwind.config.js`.

## Component Patterns

- Check `frontend/src/_ui/` (53+ components) before creating new UI components.
- Functional components with hooks only. No class components.
- File structure: `ComponentName/index.js` + optional `ComponentName.jsx` + `style.scss`.
- Compose with Radix UI primitives for accessible interactive elements.

## Imports

- Use `@/` path alias (maps to `frontend/src/`): `import Button from '@/_ui/Button'`.
- No deep relative paths (`../../..` is a smell).
- Barrel imports are being phased out. Import from the file that actually defines the export
  (`@/_services/authentication.service`), not the folder's `index.js` (`@/_services`) — barrels
  obscure what a file actually depends on and block tree-shaking. This applies inside `ee/`/`cloud/`
  too, not just `src/`.

## Edition-Specific Code (CE/EE/Cloud)

- EE/cloud-only code lives under `frontend/ee/` / `frontend/cloud/` and MUST be imported via the `@ee/` / `@cloud/` aliases, never a relative path — `NormalModuleReplacementPlugin` swaps these aliases out for CE builds; a relative import bypasses that and ships real EE code into the CE bundle.
- For a component/page that needs a different implementation (or none) per edition, use `pickEditionSpecificComponent` (`frontend/src/modules/common/helpers/pickEditionSpecificComponent.tsx`) — pass explicit `{ce, ee, cloud}` component references. Don't add new usages of `withEditionSpecificComponent`/`withEditionSpecificModule` (registry-based; eagerly bundles the whole EE module barrel and resolves components by name-string lookup) unless extending a file already built on the old pattern, where a full migration is out of scope for the current change.
- Don't assume `cloud` behaves like `ee` — some features are `ee`-only, some are `ee`+`cloud`. Check before defaulting; `cloudSameAsEE: true` is opt-in, not automatic.
- Prefer keeping edition resolution inside the feature module's own entry point (e.g. `src/modules/<feature>/index.js`) rather than in `App.jsx` or other shared shell files, wherever the feature maps cleanly to one module — `App.jsx` should generally only call the module's public export, not import `@ee/...` directly. Not an absolute rule: for genuinely cross-cutting App-shell concerns that don't belong to any single feature module (e.g. a global banner or layout toggle), resolving the edition directly in `App.jsx` is fine — still use `pickEditionSpecificComponent` with a `lazy()` reference there rather than a raw `@ee/...` import wherever applicable and it makes sense to lazy load the code.
- Lazy-load (`React.lazy`, fed into `pickEditionSpecificComponent`'s `fallback`/Suspense handling) any route, page, or large feature that's conditionally required — i.e. not needed by every user on every load (edition-gated, app-type-gated, rarely-visited settings pages, etc.).
- Draw the lazy boundary once, at the feature/page root (see `AppLoader.jsx`'s workflow-editor branch, or `RootRouter.jsx`'s ViewerApp/MainApp split) — let the rest of that feature's module tree import statically beneath that boundary. Don't wrap every small leaf component in its own `lazy()`; that fragments the bundle into many small chunks instead of one per feature.
- After migrating a feature off `withEditionSpecificComponent`/`Module`, check `ee/modules/index.js` for that feature's `export * as X from './X';` barrel line — if nothing else reads `editions.ee.X` anymore, remove it. Otherwise the heavy EE tree still gets eagerly bundled via other still-unmigrated modules' dynamic string-keyed registry lookups, silently defeating the migration.

## State Management

- Zustand with Immer middleware only. No Redux/MobX/Recoil.
- Use `shallow` comparison in `useStore` when selecting objects/arrays. Flag missing `shallow`.

## Tests

Rules: `.github/instructions/frontend-tests.instructions.md`. How to write one:
`frontend/src/test/README.md`. Reject any spec that would still pass against broken
production code. Specs are exempt from the TypeScript-only file rule.

- **A spec must reach the code it covers.** The first check on any spec: it must reach
  the changed production file by a direct import, by the real composed store (which
  reaches every slice), or via `widgetHarness`. Reaching it through none of those —
  because the spec stands up its own fake — is a reject however many assertions it has.
  Going through the store or harness rather than naming the file is normal and correct.
- **Never reimplement production logic in a spec** — not in a `jest.mock` factory, a
  local `buildMockStore`/`createMockStore` helper, or a `createStore(...)` seeded with
  hand-written state (`createStore` against a real slice factory is fine). Never mock
  or hand-roll the App Builder store to test store behaviour — use the real composed
  store via `seedApp()` / `AppBuilderTestSession` / `createWidgetHarness()`. "The real
  store is too much setup" is not a reason.
- **Fake HTTP only at the MSW boundary**; assert on the store, never on a mock.
  Assertions must match the real signature — a void action returns `undefined`.
- **Reject assertion-free specs and tautological assertions.** A bug fix ships with a
  spec that was red before the fix.
- **Name specs `*.spec.[jt]s(x)` inside a `__tests__/` directory** or jest never runs
  them. Imports the real store → `__tests__/integration/`, else `__tests__/`. Placement
  passing `test:layout` is not evidence a spec is correct.
- **Widget specs use `createWidgetHarness()`** and may only assert on properties and
  events the widget's schema declares.

## Icons & Assets

- Use Tabler Icons (`@tabler/icons-react`) or Lucide React (`lucide-react`). Do NOT add new icon packages.
- Static assets: `frontend/assets/images/`.

## Security

- No API keys/secrets in client-side code.
- Backend: parameterized queries only, never concatenate user input into SQL.

## Common Review Flags

- Hardcoded colors (hex/rgb/hsl in JSX or SCSS)
- Missing `tw-` prefix on Tailwind classes
- New `react-bootstrap` imports
- Class components
- `console.log` / debug leftovers
- Unused imports
- Missing `key` props in `.map()`
- Missing `shallow` in `useStore` selectors
- Direct DOM manipulation (except canvas drop calculations)
- A spec that reaches the changed code through neither a direct import nor the real
  store/harness, because it stands up its own fake
- Production logic reimplemented in a spec — `jest.mock` factory, `buildMockStore`-style
  helper, or a `createStore(...)` filled with hand-written state
- A mocked or hand-rolled App Builder store in a spec
- A spec asserting on a return value the production function does not have
- A spec named `*.test.*` (never runs), or an integration spec outside `__tests__/integration/`
- A bug fix touching `frontend/src/` with no spec added, or a spec that never reaches the changed line
- Relative imports into `ee/`/`cloud/` instead of the `@ee/`/`@cloud/` alias
