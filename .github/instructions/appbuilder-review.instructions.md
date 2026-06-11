---
applyTo: "frontend/src/AppBuilder/**/*"
excludeAgent: "coding-agent"
---

# App Builder — Code Review Rules

## Backward Compatibility (CRITICAL)

No change should break existing saved applications. When reviewing, always ask: "Would an app saved before this PR still load and behave correctly after it?"

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

## Event & Query Systems

- Events: `fireEvent → handleEvent → executeActionsForEventId → executeAction`. Events support `runOnlyIf` and `debounce`.
- Queries: `runQuery → resolve options → API call → update exposedValues.queries[name] → trigger dependency updates`.
- Event definitions live in `eventsSlice`, not in component definitions.

## Bundle & Performance

- Viewer (`/applications/*`) and editor are separate lazy bundles via `RootRouter.jsx`. Do not import editor-only code into viewer paths.
- Avoid `JSON.parse(JSON.stringify(...))` or `_.cloneDeep` in render/hot paths. Use Immer.
- Flag O(N) loops inside already-O(N) resolution paths (eager resolution for ListView children).

## State Management

- Global stores (`appDataStore`, `currentStateStore`, `dataQueriesStore`, `resolverStore`) should NOT be used in AppBuilder code unless absolutely critical. Prefer the AppBuilder store. Flag any new usage.
- AppBuilder store: `AppBuilder/_stores/store.js` (30+ slices). All slices are namespaced by `moduleId` (default: `'canvas'`).

## Security

- `resolveCode` uses `new Function()` — be cautious about evaluated expressions.
