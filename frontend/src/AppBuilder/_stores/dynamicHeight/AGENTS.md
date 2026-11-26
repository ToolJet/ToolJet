# Dynamic height engine (v2)

Turns measured widget heights into rendered positions for released apps and preview, without touching saved layouts. Replaces the delta-based reflow in `../utils/dynamicHeightReflow.js` (still shipped; see Edition and flags).

## Domain terms

- **Saved layout** — what the builder drew (`layouts.{desktop,mobile}`), never written by this engine.
- **Temporary layout** — the rendered `top`/`height` per widget, keyed by `getDynamicLayoutKey` (`id`, `id-<row>`, `<moduleId>::id`, `id-body`). The only state the engine keeps.
- **Flow height** — a widget's current height as it pushes others; `0` for a hidden widget with `collapseWhenHidden`.
- **Blocker** — a widget above another in a shared column; the solver pushes by the *maximum* blocker, never a sum.
- **Slot** — one container's content area (`Container`, `tabs-<tabId>`, a list view row); the unit the solver works on.
- **Height contract** — how a container takes part, declared as `heightContract` on its widget definition (`packages/widget-definitions`). Read through `contracts.js`. No file here names a widget type.

## Key files

| File | Role |
|---|---|
| `solver.js` | Pure: column sweep for blockers, `top = max(blockerTop + flow + savedGap)`. No DOM, no store. |
| `engine.js` | One pass per batch: heights inner to outer, each slot solved once, one `setTemporaryLayouts` write. |
| `containerHeight.js` | A container's height from its solved content, by contract. Rows, flex, collapsed accordions and JSON-schema forms delegate to the legacy calculation, which reads the DOM. |
| `heightRegistry.js` | One app-wide `ResizeObserver`; element → widget via a Symbol; drops unchanged and 0 px reports. |
| `scheduler.js` | Batches requests per animation frame, waits up to 3 frames for newly observed widgets, re-solves a module once after a production failure. |
| `contracts.js` | Contract lookup and the allowed `content` kinds. |
| `flags.js` | `ENABLE_DYNAMIC_HEIGHT_V2` from `window.public_config`; decided once, read lazily. |
| `__tests__/` | Solver, engine (fake frozen state, real widget definitions), scheduler, registry, flag, contracts. |

Feeding it: `_hooks/useDynamicHeightV2.jsx` registers leaves with the registry and asks for a container pass; `slices/gridSlice.js` routes `scheduleReflow` and subscribes `watchSavedLayouts`.

## Edition and flags

- Same code in all editions. `ENABLE_DYNAMIC_HEIGHT_V2=false` (server env, served in public config) runs the old engine for the whole instance. Default on.
- Under Jest the old engine is the default unless a spec sets `window.public_config.ENABLE_DYNAMIC_HEIGHT_V2 = 'true'`; the widget specs describe the old engine.
- The engine runs only where widgets enable dynamic height, which today is view mode (released app, preview). The editor shows saved layouts.

## Editor POC (temporary)

`localStorage['tj-dh-editor-poc'] = 'on'` (reload) runs the engine live in the editor following the answers in the "Dynamic Height & Collapse-When-Hidden in the editor" PDF, so Product can see each answer on a real canvas. Off by default; nothing below runs without it. Files: `editorLayout.js` (drop position → saved top, grown height baked on move and paste), `editorSticky.js` (untouched siblings keep their screen position; their saved tops are rewritten silently), `solver.js` inverse section, `engine.js` `readRenderedSlot` and the `editor` option (snap rendered tops to 10 px, reveal the selected collapsed widget), `scheduler.js` gesture pause and `watchSelection`, `flags.js` `isDynamicHeightActive`. The store is exposed as `window.__tjStore` while the flag is on. The scenario review doc lists which of these answers are expected to change.

## Invariants & gotchas

- The pass is a single downward sweep over priority buckets (`2·depth` for slots, `2·depth+1` for widgets). Queueing into a bucket already drained throws; it is a bug, not a timing issue.
- A work item that throws fails the pass outside production (tests and dev see it). In production the rest is applied, the error is logged and the scheduler re-solves that module once.
- Nothing in `engine.js` reads the DOM. A leaf without a fresh measurement keeps its last height; the registry reports again when the element changes. The delegated legacy paths in `containerHeight.js` do query the DOM.
- The store's state is frozen; the engine hands legacy helpers a Proxy over `temporaryLayouts` plus this pass's patch instead of copying it.
- Saved edges can be fractional in old apps; `solver.js` checks exact horizontal overlap, not just shared column slots.
- Positions differ from the old engine wherever side-by-side widgets grow: the old engine pushed by the sum of growths, this one by the maximum (`solver.spec.js`, "not their sum"). Apps laid out against the old behaviour move.
- The store module loads before the public config arrives. Never branch on the flag at import time; `watchSavedLayouts`, `scheduleReflow` and `useDynamicHeight` all check it per call.
- Measured heights are rounded to whole pixels; the engine does not snap to the 10 px grid.

## Related

- `../utils/dynamicHeightReflow.js` — legacy engine and the helpers still used here (`resolveWidgetVisibility`, `getExtraContainerHeight`, `resolveContainerHeight`, `resolveListviewHeightFromRows`).
- `AppCanvas/WidgetWrapper.jsx` — renders `temporaryLayouts[key].top/height`; `DYNAMIC_HEIGHT_AUTO_LIST_V2` lists leaves drawn at `height:auto`.
