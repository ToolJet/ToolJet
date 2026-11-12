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

- Flow: unresolved value → `extractAndReplaceReferencesFromString` → `resolveDynamicValues` → `resolveCode` (via `new Function()`) → resolved value stored in `resolvedSlice`
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

### Grouped error notifications

- App editor and ViewerApp (private, public, published and embedded) enable grouping in
  `_ui/Toast`. Text errors use a fixed-width collapsed card whose height fits the current message with a persistent Latest error title. Multiple visible errors at the same position show the latest message and count; replacement arrivals replay the entry animation only when another notification was above the error.
- Editor and viewer groups use View all: a scrollable list inside the latest toast.
  Older messages are absorbed into it; expansion alone retains the original expiry deadline.
  New errors at the same position appear first without remounting or replaying entry animation.
  The expiry is the later of the current deadline and the incoming error deadline, preserving hover pauses. Other notification types never extend the error toast.
  Outside the panel, each toast keeps its original lifetime and close action.
- A single text error hides the count and View all but retains the title and content-sized height.
  Interactive/custom-component/function-rendered messages and other toast types retain the original renderer. No extra debugger logs are created. Dashboard notifications
  do not enable grouping.

### Bundles and performance

- Viewer (`/applications/*`) and editor are separate lazy bundles via `RootRouter.jsx`. Never import editor-only code into viewer paths
- Avoid `JSON.parse(JSON.stringify(...))` and `_.cloneDeep` in render or hot paths — use Immer
- Watch for O(N) loops inside already-O(N) resolution paths (eager resolution for ListView children)

### App Builder store

- AppBuilder store: `AppBuilder/_stores/store.js` (30+ slices), all namespaced by `moduleId` (default `'canvas'`)
- Global stores (`appDataStore`, `currentStateStore`, `dataQueriesStore`, `resolverStore`) should not be used from AppBuilder code unless truly unavoidable — prefer the AppBuilder store

### Released-app cache

- The released-app link reuses the app definition saved in IndexedDB (`_helpers/appDefinitionCache.ts`) while its key matches the `appDataRevision` the server returns. The browser never judges freshness itself; what refreshes it is server-side (`server/src/modules/apps/AGENTS.md` § Released-app viewer cache). Logout wipes it via `clearAllViewerCaches()`.

## Widget config

### Single source of truth

Widget configs live in the shared `packages/widget-definitions` package (`src/widgets/`), imported as `@tooljet/widget-definitions` by both the frontend (`AppBuilder/WidgetManager/configs/widgetConfig.js`) and the server (`server/src/modules/apps/services/widget-config/index.js`). Edit a config once there; there is no second copy to keep in sync.

### Key changes require migrations

Moving, renaming, or removing a config key (e.g. moving `loadingState` from `styles` to `properties`) breaks existing apps. Write a migration in `server/data-migrations/`.

## Glossary

### Universal props (`universalProps`)

Schema fields merged into **every** widget by `combineProperties()` (both defined in `packages/widget-definitions/src/utils.js`; applied in `AppBuilder/WidgetManager/componentTypes.js` and the server's `widget-config/index.js`). Revamped components (`NEW_REVAMPED_COMPONENTS`) get `universalProps`; the rest get `legacyUniversalProps`. Sub-buckets: `general` (properties — e.g. `tooltip`), `generalStyles` (styles — e.g. `boxShadow`). Adding a field here applies it to all widgets at once, with no per-widget edits.

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

## Shared version lifecycle

Modules is the lifecycle reference. `Header/VersionManager/VersionLifecycleContext` supplies normalized `DRAFT`/`PUBLISHED` rows, selected version/environment, Released pointer, capabilities, notices and async actions. `useAppVersionLifecycle` preserves app/module permissions and Git behavior; `QueryLibrary/useLibraryVersionLifecycle` adapts workspace query APIs and disables Git. Adapters do not render dialogs or invent app identities.

Query Library uses the same version picker and Save/Create draft/Edit details/Promote/Release/dependency dialogs as Modules. Multiple named drafts are independent and editable only in Development. Saving freezes content and metadata while preserving the draft UUID; saved metadata is never editable. Names use the existing shared form validation (required, at most 25 characters), descriptions at most 500 characters. Explicit IDs determine draft/saved status; labels never do. Dismissing the dependency warning preserves the current selection.

Browser verification: `cypress-tests/cypress/e2e/happyPath/platform/eeTestcases/queryLibrary/versionLifecycle.cy.js`; shared renderer regressions: `VersionManager/__tests__/integration/lifecycleParity.spec.jsx` and `moduleLifecycle.spec.jsx`. Consumer credentials/authorization remain unchanged; Query Library has no Git integration.

Query Library consumer creation keeps query/snapshot selection local in the existing Library editor until Create query sends both UUIDs. Draft autosave overlays cover only unsent, in-flight or failed revisions; successful revisions yield to fresh server data. Session exit clears retry/display state but retains transport tails by workspace/query/draft until settled, so a new session cannot overtake old writes. Creating a draft selects its UUID together with the configured Development environment only while the request still owns selection.

- Library promotion follows the selected saved UUID into its returned environment atomically. Delayed promotion must not steal a different query, session, version or environment selection.

## Query Library license and edition composition

Public QueryLibrary entry components are edition-selected facades, and the public state slice keeps an inert shape for ordinary panels. EE supplies editor components, lifecycle adapter, feature state, browser execution and draft transport through existing module/slice registries. Pure input, snapshot-selection and environment helpers remain shared. Cloud selects the EE implementation.

Discovery and local execution require explicit server-computed queryLibraryEnabled === true; absence/loading/failure denies access. Routes register by edition, then the selected page loads the workspace license before any management request. Workspace access loads clear prior flags and ignore late responses from a different workspace/request. Released/public consumers request access for the consumer app workspace. Runtime uses selected nested queryPanel/dataQuery actions, preserving autosave queues, cancellation and session checks. The app builder's `dataQuerySlice` is untouched by the library: in EE, `queryLibraryDataQuerySlice` wraps its actions (wired in `_stores/store.js`) and runs the library versions only in the library editor; everywhere else the app's own actions run.

The Query Library page has no app builder shell, so it mounts the app builder's query surfaces itself: `QueryDataPane surface="left"` (no `onClose`, so no close button), then `QueryManager surface="right"` inside the `right-sidebar-query-configuration` wrapper (the right-surface styles and the preview's sizing key off that class), then the "Used by" rail. It also calls `useQueryAutosave` and wraps the editor in `QueryKeyHooks`, which the app builder gets from its runtime panel and right sidebar. Restyle the shared surfaces in `_styles/queryManager.scss`; `query-library.scss` only holds the page grid and the rail.
