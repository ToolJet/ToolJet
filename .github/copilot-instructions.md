# ToolJet App Builder — Code Review Instructions

> Scoped to the **App Builder team**. Covers `frontend/src/AppBuilder/`, `frontend/src/_ui/`, `frontend/src/_stores/`, `server/src/modules/apps/`, `server/migrations/`, and `server/data-migrations/`.

---

## Backward Compatibility (CRITICAL)

### Widget Config Sync

When any file inside `frontend/src/AppBuilder/WidgetManager/widgets/` is touched, the corresponding config in `server/src/modules/apps/services/widget-config/` MUST also be updated to stay in sync. Flag PRs that modify one without the other.

### Widget Config Key Changes Require Migrations

If a widget config change moves, renames, or removes a key (e.g., moving `loadingState` from `styles` to `properties`), this WILL break existing apps. A migration MUST be written in `server/migrations/` to transform saved app definitions. Flag any key restructuring that lacks an accompanying migration.

### General Rule

No change should break existing saved applications. When reviewing, always ask: "Would an app saved before this PR still load and behave correctly after it?"

---

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

## State Management

- Zustand with Immer middleware only. No Redux/MobX/Recoil.
- Global stores (`_stores/appDataStore`, `currentStateStore`, `dataQueriesStore`, `resolverStore`) should NOT be used in AppBuilder code unless absolutely critical. Prefer the AppBuilder store. Flag any new usage of global stores.
- AppBuilder store: `AppBuilder/_stores/store.js` (30+ slices). All slices are namespaced by `moduleId` (default: `'canvas'`).
- Use `shallow` comparison in `useStore` when selecting objects/arrays. Flag missing `shallow`.

## Resolution System (`{{}}`)

- Flow: unresolved value → `extractAndReplaceReferencesFromString` → `resolveDynamicValues` → `resolveCode` (via `new Function()`) → resolved value stored in `resolvedSlice`.
- `{{...}}` references MUST be registered in the dependency graph via `addReferencesForDependencyGraph`. Missing this causes stale renders.
- After `setExposedValue`, `updateDependencyValues` MUST be called to propagate changes.
- Inside ListView/Kanban, `customResolvables` provide row-scoped context (`listItem` / `cardData`).

## Rendering Pipeline

`AppCanvas → Container → WidgetWrapper → RenderWidget → Widget`

- Widgets receive resolved props from `RenderWidget`. They must NOT directly access store state.
- `setExposedVariable` and `fireEvent` are passed as callbacks — widgets use these to communicate outward.

## Subcontainer Architecture

- `SubcontainerContext` carries `contextPath` array: `[{ containerId, index }, ...]`.
- Row-scoped resolution uses prototype overlay (`prepareRowScope`/`updateRowScope`).
- Child-to-parent: `setExposedValuesPerRow` → `_deriveListviewChain` (no callback chains).
- ListView nesting limited to **2 levels**. Only row 0 is editable; others are read-only mirrors.
- `findNearestSubcontainerAncestor` is critical for dependency resolution — verify it's used when walking the component tree.
- Keywords: `listItem` (ListView), `cardData` (Kanban). Don't mix them up.

## Widget Definitions

Configs: `AppBuilder/WidgetManager/widgets/*.js` → registered in `componentTypes.js`.

- New widgets MUST be lazy-loaded.
- Use `useBatchedUpdateEffectArray` for batched state updates.
- Default `definition` values should use design tokens, not hardcoded hex.
- Remember: changes to config keys require server-side sync + potential migration (see Backward Compatibility above).

## Event & Query Systems

- Events: `fireEvent → handleEvent → executeActionsForEventId → executeAction`. Events support `runOnlyIf` and `debounce`.
- Queries: `runQuery → resolve options → API call → update exposedValues.queries[name] → trigger dependency updates`.
- Event definitions live in `eventsSlice`, not in component definitions.

## Bundle & Performance

- Viewer (`/applications/*`) and editor are separate lazy bundles via `RootRouter.jsx`. Do not import editor-only code into viewer paths.
- Avoid `JSON.parse(JSON.stringify(...))` or `_.cloneDeep` in render/hot paths. Use Immer.
- Flag O(N) loops inside already-O(N) resolution paths (eager resolution for ListView children).

## Icons & Assets

- Use Tabler Icons (`@tabler/icons-react`) or Lucide React (`lucide-react`). Do NOT add new icon packages.
- Static assets: `frontend/assets/images/`.

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
- Widget config changes without server-side sync or migration
- New usage of global stores (`appDataStore`, `currentStateStore`, `dataQueriesStore`, `resolverStore`) in AppBuilder code — prefer the AppBuilder store

## Security

- No API keys/secrets in client-side code.
- `resolveCode` uses `new Function()` — be cautious about evaluated expressions.
- Backend: parameterized queries only, never concatenate user input into SQL.

---

## Data Migration Logging Guidelines

**Applies to:** `server/data-migrations/**/*`

New migrations must include progress logging:

1. **Baseline** — Before processing, query and log total records:
   `[START] {Action} | Total: {Total}`

2. **Progress** — During execution, log using current/total format:
   `[PROGRESS] {Current}/{Total} ({Percentage}%)`

3. **Confirmation** — Log final success:
   `[SUCCESS] {Action} finished.`

### Reviewer Checklist for `server/data-migrations/`

- [ ] Count query establishes a **total** before processing
- [ ] Log statements use the **`x/total`** ratio pattern
- [ ] Clear **success** log at the end
- [ ] No silent bulk updates without console feedback
