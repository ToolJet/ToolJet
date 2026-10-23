# ToolJet Frontend — Agent Context

React + Webpack. Edition composition (webpack aliases, registries, `fetchEdition()`) is covered in the root `AGENTS.md` — this file covers conventions and App Builder architecture.

## Stack and version traps

Write code for the installed major version, not the latest one. `package.json` is the source of truth.

| Library | Version | Implication |
|---|---|---|
| React | 18 | No React 19 APIs (`use`, ref-as-prop, `useActionState`). Use `forwardRef` to pass refs |
| Tailwind CSS | 3 | JS config in `tailwind.config.js`, not v4 `@theme` CSS. Prefix `tw-`, preflight disabled |
| react-router-dom | 6.8 | `<BrowserRouter>` in `RootRouter.jsx`, not a data router: no loaders or actions. Class components use `@/_hoc/withRouter` |
| Zustand | 4 | `import { shallow } from 'zustand/shallow'` as the second `useStore` argument. Not the v5 `useShallow` |
| Immer | 9 | Via `zustand/middleware/immer` |
| TypeScript | 5 | Compiled by Babel (`@babel/preset-typescript`), type-checked only by `npm run typecheck` |

Other library choices:

- Dates: `moment` / `moment-timezone`. Do not add `dayjs` or `date-fns`
- i18n: `react-i18next` (`useTranslation`) for user-facing strings
- Class merging: `cn()` from `@/lib/utils` (prefix-aware `tailwind-merge`)

## TypeScript

Write new files as `.ts` / `.tsx`. Do not convert an existing `.js` / `.jsx` file unless the task is about that file. The codebase is about 65 TS files to 2,600 JS files, so most imports are untyped JS.

- `strict` is on. Avoid `any` (lint warns): use `unknown` and narrow it, or write a minimal interface
- When importing an untyped JS module, cast it once at the import site rather than spreading `any` (see `AppBuilder/Shared/EntityUsage/EntityUsageList.tsx`)
- Use `export type` when re-exporting a type (`export type { User } from './types'`). Babel compiles one file at a time and can't tell a re-exported type from a value, so it keeps the export and it is `undefined` at runtime
- Prefer union literals or `as const` objects to enums. Babel turns a `const enum` into a regular enum object
- No `namespace` or `@ts-ignore` (lint errors)
- Put props in an `interface ComponentNameProps` on the function parameter. Keep types next to their code; shared domain types go in `*.types.ts` (e.g. `AppBuilder/types/`)
- Zustand stores: type the state with an interface (see `_stores/customComponentLibrariesStore.ts`)
- Global (non-AppBuilder) stores use `create` from `@/_stores/utils`, not from `zustand` directly. It registers the store with `resetAllStores()`
- Ambient module declarations (e.g. `config`) live in `src/config.d.ts`

### TypeScript tooling gaps (known)

- **Babel does not type-check.** A `.tsx` file with type errors still builds and runs. Run `npm run typecheck` before finishing. CI runs lint but not typecheck, and `main` already has a few type errors, so don't add new ones
- **Aliases are defined twice.** `paths` in `tsconfig.json` mirrors `resolve.alias` in `webpack.config.js`; change both together. SVG import types live in `src/assets.d.ts`

## Commands

Test commands are under [Testing](#testing).

```
npm start                 # dev server on :8082 (runs build:vendor first)
npm run lint              # ESLint over src/ and ee/; CI blocks on errors
npm run typecheck         # tsc --noEmit; required for TS changes (not run in CI)
```

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

- Choose a UI primitive in this order:
  1. **Rocket**, the design system (`src/components/ui/Rocket/`). Import from the component file (`import { Button } from '@/components/ui/Rocket/Button/Button'`), not the barrel `@/components/ui/Rocket`, so tree shaking keeps working. This overrides the barrel advice in its `README.md`; follow that file's other rules. Never edit `Rocket/shadcn/`, which is managed by the CLI
  2. `src/_ui/` (55+ older components), if Rocket has no equivalent
  3. Raw Radix UI primitives, if neither has one
- Exception, for now: dashboard redesign code (`src/pages/`) uses the older `src/components/ui/Button/Button.jsx`, not the Rocket `Button`. Its `secondary` variant matches Figma (default text, brand icon); Rocket's uses brand text
- Do not use `react-bootstrap` (`OverlayTrigger`, `Modal`) or `react-tooltip` in new code; use the Rocket `Tooltip` and `Dialog`
- Functional components with hooks only — no class components
- File structure: `ComponentName/index.js` + optional `ComponentName.jsx` + `style.scss`
- New widgets MUST be lazy-loaded
- `useBatchedUpdateEffectArray` for batched state updates
- Widget components must be registered in `AppBuilder/WidgetManager/componentTypes.js`

## Conventions

### Styling

- Tailwind classes MUST carry the `tw-` prefix (`tw-flex`, `tw-text-default`). Unprefixed Tailwind is a bug
- Never hardcode hex/rgb colors — use CSS variable tokens via Tailwind (`tw-text-default`, `tw-bg-page-default`) or `var(--text-default)`. This includes default values
- Prefer Tailwind over Bootstrap for new code; do not extend legacy `react-bootstrap` usage
- Use typography utilities (`tw-font-title-default`, `tw-font-body-default`) instead of ad-hoc font-size/weight
- Design tokens:
  - Add new tokens to `src/_styles/componentdesign.scss` **and** `tailwind.config.js`
  - Use `--cc-*` variables only in App Builder widgets (app theme, set at runtime in `useAppData.js`)
  - `src/_styles/designtheme.scss` is legacy; don't add to it
- These variables are defined in both token files. Whichever file is imported later wins (`componentdesign.scss` in `theme.scss`). Values differ where marked:
  - `--text-default`, `--text-placeholder`
  - `--text-disabled` (differs in light and dark)
  - `--text-on-solid` (differs in dark)
  - `--interactive-default` (differs in dark), `--interactive-hover` (differs in light and dark)
  - `--elevation-000-box-shadow` … `--elevation-700-box-shadow`
- Preflight is off: set `tw-border-solid` whenever you set a border width or color
- Dark mode is the `dark-theme` class on the body. Tokens switch automatically, so `dark:` variants are rarely needed

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
