# ToolJet Frontend — Agent Context

React + Webpack. Edition composition (webpack aliases, registries, `fetchEdition()`) is covered in the root `AGENTS.md` — this file covers conventions and App Builder architecture.

## Testing

> Tests are written first. A spec that still passes against broken production code certifies nothing.

**Full reference: `src/test/README.md`** (all frontend code). Review rules: `.github/instructions/frontend-tests.instructions.md`.

- **Stack:** Jest + Testing Library + MSW.
- **Layout:**
  - specs are `*.spec.*` in a colocated `__tests__/`; `*.test.*` files never run;
  - specs that import the real store go in `__tests__/integration/`;
  - `npm run test:layout` enforces this.
- **Workflow:**
  - **Red first.** A bug fix starts with a failing reproduction, using `test.failing` until the fix lands.
  - **Break to prove.** Break the code once to confirm each test fails.
- **Jest vs Cypress:** full route flows belong in Cypress (`cypress-tests/`), not Jest.
- **Run** (from `frontend/`):
  - `npx jest <path>`, or `npm test` for the full suite;
  - `npx jest --changedSince=origin/<base>` to run what a branch touched. `test:unit:changed` (`--onlyChanged`) only sees uncommitted files.
- **CI** runs `test:layout`, then the full `test:ci`, on any frontend change. There is no frontend coverage gate.

### App Builder (`src/AppBuilder/**`)

On top of the above:
- Read `src/test/app-builder/README.md` for the test seams and the no-mock rule.
- Run `npm run test:app-builder`, plus `:contracts` and `:parity -- --edition ce|ee` when a widget changes.
- **Registered widgets** are listed in `widget-testing-manifest.json` with their status and contract path. Each has an EE `TESTING.md` contract that goes through `ee/.agents/skills/app-builder-widget-tdd/SKILL.md` (research, human approvals, execution).
  - A widget whose contract isn't `approved` needs a human before its tests can change.
  - Widget-specific facts stay in that widget's contract. Transfer sibling findings only when the public behavior, runtime, or infrastructure applies.
- **Browser-level widget scenarios** are QA-owned Cypress specs (`cypress-tests/cypress/support/componentAutomation/README.md`).

## Component patterns

- Check `frontend/src/_ui/` (55+ components) before creating a new UI component
- Functional components with hooks only — no class components
- File structure: `ComponentName/index.js` + optional `ComponentName.jsx` + `style.scss`
- Compose with Radix UI primitives for accessible interactive elements
- New widgets MUST be lazy-loaded
- `useBatchedUpdateEffectArray` for batched state updates
- Widget components must be registered in `AppBuilder/WidgetManager/componentTypes.js`

## Conventions

### Styling

- Tailwind classes MUST carry the `tw-` prefix (`tw-flex`, `tw-text-default`). Unprefixed Tailwind is a bug
- Never hardcode hex/rgb colors — use CSS variable tokens via Tailwind (`tw-text-default`, `tw-bg-page-default`) or `var(--text-default)`. This includes default values
- Prefer Tailwind over Bootstrap for new code; do not extend legacy `react-bootstrap` usage
- Use typography utilities (`tw-font-title-default`, `tw-font-body-default`) instead of ad-hoc font-size/weight
- Design tokens: `frontend/src/_styles/designtheme.scss` + `frontend/tailwind.config.js`

### Imports

- Use the `@/` alias (maps to `frontend/src/`): `import Button from '@/_ui/Button'`
- Deep relative paths (`../../..`) are a smell

### State management

- Zustand with Immer middleware only. No Redux/MobX/Recoil
- Use `shallow` comparison in `useStore` when selecting objects or arrays

### Icons and assets

- Tabler Icons (`@tabler/icons-react`) or Lucide React (`lucide-react`) only — do not add new icon packages
- Static assets live in `frontend/assets/images/`

## App Builder architecture

### Backward compatibility (CRITICAL)

No change may break existing saved applications. Always ask: would an app saved before this PR still load and behave correctly after it?

### Resolution system (`{{}}`)

- Flow: unresolved value → `extractAndReplaceReferencesFromString` → `resolveDynamicValues` → `resolveCode` (via `new Function()`) → resolved value stored in `resolvedSlice`. The template functions live in the data engine (`_engines/data/expressions.js`, re-exported from `_stores/utils.js`): how a template is read and its compiled function are remembered per text, the evaluation runs every time
- `{{...}}` references MUST be registered in the dependency graph via `addToDependencyGraph`. Missing this causes stale renders
- After `setExposedValue`, call `updateDependencyValues` to propagate changes
- Inside ListView/Kanban, `customResolvables` provide row-scoped context (`listItem` / `cardData`)

### Rendering pipeline

`AppCanvas → Container → WidgetWrapper → RenderWidget → Widget`

- Widgets receive resolved props from `RenderWidget`; they must NOT read store state directly
- `setExposedVariable` and `fireEvent` are passed as callbacks — widgets use these to communicate outward

### Subcontainers

- `SubcontainerContext` carries a `contextPath` array: `[{ containerId, index }, ...]`
- Row-scoped resolution uses prototype overlay (`prepareRowScope` / `updateRowScope`)
- Child-to-parent: `setExposedValuesPerRow` → `_deriveListviewChain`, not callback chains
- ListView nesting is limited to **2 levels**. Only row 0 is editable; the rest are read-only mirrors
- `findNearestSubcontainerAncestor` is load-bearing for dependency resolution — verify it is used when walking the component tree
- `listItem` is ListView, `cardData` is Kanban. Don't mix them up

### Events and queries

- Events: `fireEvent → handleEvent → executeActionsForEventId → executeAction`. Events support `runOnlyIf` and `debounce`
- Queries: `runQuery` → resolve options → API call → update `exposedValues.queries[name]` → trigger dependency updates
- Event definitions live in `eventsSlice`, not in component definitions

### Data engine (`src/AppBuilder/_engines/data/`)

How the App Builder handles data of any size without blocking the page or running the tab out of memory. Reuse it; don't hand-roll another version.

- Everything in the store is deep-frozen, as Immer's auto-freeze always did, so no code but the store's setters can change a query's or component's data (`freeze.js`: `deepFreeze` at every store entry point; a query's result frozen in slices with `deepFreezeInSlices` before it's previewed or stored). A value already frozen is taken as frozen throughout: never freeze a stored value only at its top level
- Dependents of a change re-resolve through the propagation scheduler (`propagation.js`): at once when small (≤ 64 dependents or within 8 ms), else in 8 ms slices, one store write per slice. `setResolvedQuery` returns a promise when it continues in slices; `processQueryResults` awaits it before `onDataQuerySuccess` and before `run()` resolves, and variable actions resolve on `propagationSettled()`. `updateDependencyValues` stays synchronous (one write). `flushImplicitBatchEntries` resolves everything pending
- Work that grows with the data runs in slices (`slices.js`: `runSliced`, `forSliced`), never as one long task
- Change detection: `sameValue` / `sameExposedValue` (`equality.js`, lodash `isEqual` semantics; frozen pairs remembered, arrays compared element by element by identity first) and `useContentStable` for hook dependencies — never `JSON.stringify` keys. `diff.js` is deep-object-diff's `diff`
- Validation keeps a value that fits its schema as is (`shape.js`: `fitsDefinition`, also on page switch): superstruct's `create` copies every row. It answers only where `create` would return the same content
- Scripts (RunJS, transformations, Python) get `lazyCopies` of the queries, `page` and `variables` (`clone.js`): a value is copied when first read. A copy that wouldn't fit in the tab's memory throws a `MemoryBudgetError` naming it (`memory.js`) instead of crashing the tab. A RunJS result is checked for cycles in slices (`cycles.js`)
- A ListView/Kanban child property that reads nothing row-scoped (`readsNothingRowScoped`) resolves once, not once per row
- Large query responses are parsed in a worker (`transport.js`); debugger logs keep the newest 1,000 entries and bounded snapshots of logged values (`bounded.js`)
- Kill switches: `_engines/features.js` (`DISABLE_BACKGROUND_DATA`)

### Bundles and performance

- Viewer (`/applications/*`) and editor are separate lazy bundles via `RootRouter.jsx`. Never import editor-only code into viewer paths
- Avoid `JSON.parse(JSON.stringify(...))` and `_.cloneDeep` in render or hot paths — use Immer
- Watch for O(N) loops inside already-O(N) resolution paths (eager resolution for ListView children)

### App Builder store

- AppBuilder store: `AppBuilder/_stores/store.js` (30+ slices), all namespaced by `moduleId` (default `'canvas'`)
- Global stores (`appDataStore`, `currentStateStore`, `dataQueriesStore`, `resolverStore`) should not be used from AppBuilder code unless truly unavoidable — prefer the AppBuilder store

## Widget config

### Server-side sync (CRITICAL)

Changing a widget config in `frontend/src/AppBuilder/WidgetManager/widgets/` requires the matching update in `server/src/modules/apps/services/widget-config/`. The two are maintained independently; changing one without the other is a bug.

### Key changes require migrations

Moving, renaming, or removing a config key (e.g. moving `loadingState` from `styles` to `properties`) breaks existing apps. Write a migration in `server/data-migrations/`.

## Glossary

### Universal props (`universalProps`)

Schema fields merged into **every** widget by `combineProperties()` in `AppBuilder/WidgetManager/componentTypes.js`. Sub-buckets: `general` (properties — e.g. `tooltip`), `generalStyles` (styles — e.g. `boxShadow`). Adding a field here applies it to all widgets at once, with no per-widget edits.

### CSS class (widget-level)

A user-authored className (or space-separated classNames) applied to a single widget instance's root DOM node, so custom CSS at workspace or app level can target it. Distinct from **Custom CSS** — the CSS *text* itself, which exists at app/workspace scope via `customStylesService` → the `workspace-custom-css` `<style>` tag.

## Security

- No API keys or secrets in client-side code
- `resolveCode` uses `new Function()` — be careful with what reaches evaluated expressions

## Review gotchas

- Hardcoded colors (hex/rgb/hsl in JSX or SCSS)
- Missing `tw-` prefix on Tailwind classes
- New `react-bootstrap` imports
- Class components
- `console.log` or debug leftovers
- Unused imports
- Missing `key` props in `.map()`
- Missing `shallow` in `useStore` selectors
- Direct DOM manipulation (canvas drop calculations excepted)

## Decisions log

Widget-level CSS class (shipped 2026-06):

- Added **globally** via `universalProps`, not per-widget
- Lives in the **Styles** tab under an **Advanced** accordion, not Properties
- Applied to the inner `canvas-component _tooljet-{name}` node in `RenderWidget.jsx`, not the outer `WidgetWrapper` — avoids fighting the layout engine
- Field type `code` (supports `{{}}` bindings); single space-separated string, multiple classes allowed
- CSS authoring reuses existing app/workspace custom CSS (`customStylesService`); this feature ships only the class hook
- Applies in both editor canvas and viewer/public app
- Added to `universalProps.styles` (not `generalStyles`) in **both** `componentTypes.js` and `server/.../widget-config/index.js`. No DB migration — `lodash.merge` injects the default at load
  - Why `styles`: `generalStyles` ignores the `accordian` key and only renders for non-revamped widgets. `styles` rides `RenderStyleOptions`, which groups by `accordian`, so `accordian: 'Advanced'` yields an Advanced accordion on all revamped widgets with no registration
- Schema key `cssClass`, label "CSS class", accordion "Advanced" (pinned last). Sanitize = trim + collapse whitespace, no blocklist
- Legacy non-revamped widgets (~24, mostly deprecated V1 duplicates) render the field as a top-level control rather than grouped — accepted, no wiring on the sunsetting path
- v1 is static + `{{}}`-bound class only; imperative runtime control (CSA `setCustomClass`) deferred to v2
- Gated behind the `customStyling` license flag (same flag as app/workspace Custom CSS, which it depends on), read via `useStore((s) => s.license.featureAccess?.customStyling)`. Two gates: the Inspector hides the control, and `RenderWidget.jsx` skips appending the class. **The saved value is never erased** — re-enabling the license restores the classes, no migration or cleanup
