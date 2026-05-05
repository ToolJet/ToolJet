# SPEC: Flex Container Widget (MVP)

> Source plan: `~/.claude/plans/we-want-to-build-fancy-treehouse.md`
> Branch: `Stack-component` (existing git branch name; feature itself is named "Flex Container" everywhere)
> Status: Spec — pending implementation

---

## 1. Objective

Add a Retool-style flex auto-layout container — named **Flex Container** everywhere (file names, identifiers, `componentType` string, user-facing label) — to the ToolJet app builder.

ToolJet today places every container child via 43-unit absolute grid coordinates (`top`, `left`, `width`, `height`). Flex Container introduces a **layout-mode boundary**: the widget itself is a normal grid widget in its parent, but its own children render and interact via flexbox.

**Behavioral contract for users (ToolJet app builders):**

- Drag any widget into a Flex Container → it appends as the **last child**. Flex layout (gap/padding/justify/align) determines visual placement; the user does not set `top`/`left`.
- Reorder children **inside** a Flex Container by dragging — visible insertion line snaps to slot midpoints.
- Drag a child **out** of a Flex Container onto the canvas → it reverts to absolute grid positioning with synthesized `top/left/width/height`.
- Resize a Flex Container child → only the main axis (south handle for vertical). Cross-axis is `100%`.
- Outside a Flex Container, all existing absolute-grid behavior is unchanged.

**Success criteria (MVP demo):**

User drops 3 widgets into a Flex Container, reorders them, drags one out to the canvas, saves the app, reloads — every step works without manually editing grid coordinates and without regressions in any existing container widget.

---

## 2. Scope

### In scope (MVP)

- `direction`: `'column'` | `'row'`. Both enabled in Inspector.
- Flex Container properties: `gap` (px), `padding` (px), `justify`, `align`, plus standard Container styles (background, border, shadow).
- Per-child properties: `fillMain` (toggle → `flex: 1 1 0`), `crossAlignSelf` (override).
- Drop into Flex Container: appends as last child (`order` = max + step), flex layout determines final placement.
- Reorder inside Flex Container: drag via **react-moveable** (existing) — same drag that moves canvas widgets — with visible 2px insertion line driven by `gridSlice.flexContainerDropTarget`.
- Drag a child out of Flex Container to canvas: reuse standard reparenting flow; synthesize absolute layout from drop coords.
- Schema is purely additive. Old apps load unchanged.
- Mobile layout: per-layout `mainHeight` / `mainWidth` / `order` / `fillMain` keyed the same way as `top/left/width/height` today.
- Overflow: Flex Container has fixed outer height (user-set on grid); inner flex container uses `overflow-y: auto`.

### Out of scope (deferred)

- Dynamic-height auto-grow for Flex Container outer height.
- Undo/redo coverage of Flex-Container-specific operations (reorder, reparent into/out of Flex Container). Operations write to the store but undo cleanliness is not guaranteed this round.
- Multi-select drag mixing Flex Container and grid children — filter such selections at drag-start; documented v2 follow-up.
- Automated tests (manual verification only for MVP).

---

## 3. Schema

`layouts[currentLayout]` for a Flex Container child carries a different shape than a grid child:

| Field | Grid child | Flex Container child |
|---|---|---|
| `top`, `left` | grid units | **absent** |
| `width` | grid units | **absent** (cross-axis = 100%) |
| `height` | grid units | **absent** |
| `order` | — | sparse integer (1000, 2000, 3000) — canonical sort key |
| `mainHeight` | — | px height — set when parent `direction='column'`; ignored when `fillMain=true` |
| `mainWidth` | — | px width — set when parent `direction='row'`; ignored when `fillMain=true` |
| `fillMain` | — | boolean → CSS `flex: 1 1 0` on main axis |
| `crossAlignSelf` | — | optional override of parent `align` |

- `order` is canonical. Survives serialization and collaborative edits.
- `containerChildrenMapping[flexContainerId]` is kept sorted by `order` for cheap rendering.
- Flex Container itself stores `{top, left, width, height}` in grid units like any widget.

`componentType` string is `'FlexContainer'`. Schema is **purely additive** — no migration needed for existing apps.

---

## 4. Project structure

### Files to modify

| File | Change |
|---|---|
| `frontend/src/AppBuilder/AppCanvas/appCanvasConstants.js:59` | Add `'FlexContainer'` to `DROPPABLE_PARENTS`. |
| `frontend/src/AppBuilder/AppCanvas/Grid/gridUtils.js:657` | No change to `findNewParentIdFromMousePosition`. Insertion index computed separately in `flexContainerDragEnd.js` and `Grid.jsx onDrag` using `getFlexChildRects` + `computeInsertionIndex`. |
| `frontend/src/AppBuilder/AppCanvas/Container.jsx` | Branch on `componentType === 'FlexContainer'`: skip grid-cell math; root is `display:flex; flex-direction; gap; padding; justify; align; flex-wrap`; render children through `FlexContainerChildWrapper` directly (no `DndContext`/`SortableContext`); in `useDrop({hover})` compute insert index for first-drop-from-panel only, write to `gridSlice.flexContainerDropTarget`, throttle per `requestAnimationFrame`. |
| `frontend/src/AppBuilder/AppCanvas/WidgetWrapper.jsx` | No change. |
| `frontend/src/AppBuilder/AppCanvas/Grid/Grid.jsx` | Per-target `renderDirections` for Moveable: `['s']` when child's parent is a column Flex Container, `['e']` when row Flex Container, all 8 otherwise. In `onDrag` for Flex Container child: skip grid snap, apply free transform, compute insertion slot from mouse position via `computeInsertionIndex(getFlexChildRects(parentId), clientPos, direction)` (rAF-throttled), write to `flexContainerDropTarget`. Route `onDragEnd` through `flexContainerDragEnd.js` when source parent is a Flex Container. In `onResizeEnd` for Flex Container child: write `mainHeight` (column) or `mainWidth` (row) px only — never `top/left/width/height`. |
| `frontend/src/AppBuilder/_stores/slices/componentsSlice.js:1560` | `setComponentLayout` parent-mode branch: into Flex Container → write `{order, mainHeight\|mainWidth, fillMain}` (keyed by parent `direction`), splice into `containerChildrenMapping[flexContainerId]` at `insertIndex`, skip top/left writes. Out of Flex Container → strip all Flex-Container-only fields (`order`, `mainHeight`, `mainWidth`, `fillMain`, `crossAlignSelf`), synthesize `{top,left,width,height}` from drop coords. Add `reorderFlexContainerChild(flexContainerId, componentId, newIndex)` action. |
| `frontend/src/AppBuilder/_stores/slices/gridSlice.js` | Add `flexContainerDropTarget: { flexContainerId, index } \| null` + setter. |

### Files to create

| File | Purpose |
|---|---|
| `frontend/src/AppBuilder/Widgets/FlexContainer/FlexContainer.jsx` | Runtime render. `direction` prop maps directly to CSS `flex-direction` (`'column'` or `'row'`). `flex-wrap` switches on `flexWrap` prop: `nowrap` (default) / `wrap`. Overflow: column→`overflow-y: auto` when `flexWrap=false`; row→`overflow-x: auto` when `flexWrap=false`; wrap=true→natural wrap flow, no overflow scroll. Outer height/width fixed by user via grid resize (no auto-grow). |
| `frontend/src/AppBuilder/Widgets/FlexContainer/FlexContainerChildWrapper.jsx` | Per-child wrapper for Flex Container kids. Carries the `target widget-target moveable-box` classes that react-moveable needs. Owns `ConfigHandle`. No `useSortable`, no drag handle, no CSS transform animation — moveable handles all drag. |
| `frontend/src/AppBuilder/Widgets/FlexContainer/FlexContainerDropIndicator.jsx` | 2px insertion line with circular caps. Vertical Flex Container: horizontal line, full inner-width. Horizontal Flex Container: vertical line, full inner-height. Subscribes to `gridSlice.flexContainerDropTarget` with a `[flexContainerId, index]` selector + `shallow`. `pointer-events: none`. |
| `frontend/src/AppBuilder/Widgets/FlexContainer/FlexContainerEmptyPlaceholder.jsx` | "Drop a component here" CTA, 64px dashed box. Visible iff `children.length === 0`. |
| `frontend/src/AppBuilder/Widgets/FlexContainer/flexContainer.utils.js` | Pure helpers: `computeInsertionIndex(rects, mousePos, direction)` — uses `clientY` for column, `clientX` for row; `synthesizeGridLayoutFromDrop`; `stripFlexContainerLayoutFields` — strips `order`, `mainHeight`, `mainWidth`, `fillMain`, `crossAlignSelf`. |
| `frontend/src/AppBuilder/AppCanvas/Grid/helpers/flexContainerDragEnd.js` | Called from `Grid.jsx onDragEnd` when source parent is a Flex Container. Three cases: (1) dropped back into **same** Flex Container → compute final insertion index from drop coords, call `reorderFlexContainerChild`; (2) dropped into a **different** Flex Container → `setComponentLayout` with new parent + computed `order`; (3) dropped onto canvas → strip Flex-Container-only fields, synthesize `{top,left,width,height}` from drop coords. |
| `frontend/src/AppBuilder/WidgetManager/widgets/flexContainer.js` | Inspector schema. Properties: `direction` (Select, `['column', 'row']`, both enabled), `gap` (Number, default 8), `padding` (Number, default 12), `justify` (Select: `flex-start \| center \| flex-end \| space-between \| space-around`), `align` (Select: `flex-start \| center \| flex-end \| stretch`, default `stretch`), `flexWrap` (Toggle, default `false`). Standard Container style section (background, border, shadow). Per-child schema additions: `fillMain` (Toggle), `crossAlignSelf` (Select). User-facing label: **"Flex Container"**. |

---

## 5. Drop / drag sequences

### 5a. First-time drop from widget panel → Flex Container `F` (react-dnd)

```
User             react-dnd     Container(F)         gridSlice            componentsSlice
mousedown ─────► HTML5 drag ──► useDrop.hover
                                 cache rects (once, on first hover)
                                 (no insertion-line snap on bare-canvas first hover;
                                  engages once cursor enters existing children's bounds)
                                 (rAF throttle) ───► setFlexContainerDropTarget
                                                      (F.id, idx)
                                                      └─► FlexContainerDropIndicator re-renders line
drop ─────────► useDrop.drop ──► append as last child
                                 order = max(existingOrders) + 1000
                                 ────────────────────────────────────────► moveComponent(id, F.id, order)
                                 clear flexContainerDropTarget
                                 Flex Container re-flows via flexbox; no top/left writes on this path.
```

### 5b. Reorder within Flex Container `F` (react-moveable)

```
User             Moveable      Grid.onDrag          gridSlice            componentsSlice
mousedown ─────► onDragStart ─► ghost on
move ──────────► onDrag ───────► skip grid snap
                                 apply free transform
                                 computeInsertionIndex(
                                   getFlexChildRects(F.id),
                                   {x: clientX, y: clientY},
                                   direction
                                 ) (rAF throttle) ─► setFlexContainerDropTarget
                                                      (F.id, idx)
                                                      └─► FlexContainerDropIndicator re-renders line
mouseup ───────► onDragEnd ────► flexContainerDragEnd.js
                                   target = same FlexContainer F
                                   compute final idx from drop coords
                                   ────────────────────────────────► reorderFlexContainerChild(F.id, id, idx)
                                                                      (single store mutation)
                                 clear flexContainerDropTarget; ghost off
                                 Flex Container re-flows via flexbox.
```

### 5c. Drag a Flex Container child OUT to canvas (react-moveable)

```
User             Moveable      Grid               flexContainerDragEnd.js componentsSlice
mousedown ─────► onDragStart ─► ghost on
move ──────────► onDrag ───────► skip grid snap; apply free transform
                                 (mouse outside F bounds → flexContainerDropTarget = null)
mouseup ───────► onDragEnd ────► dispatch ──────► target ≠ FlexContainer
                                                  strip all flex-only fields
                                                  synthesize {top,left,width,height}
                                                  from drop coords
                                                  ────────────────────────► setComponentLayout
                                 ghost off
```

### 5d. Resize a Flex Container child (react-moveable)

```
User             Moveable      Grid                                       componentsSlice
mousedown ─────► onResizeStart (south handle ['s'] if column; east handle ['e'] if row)
drag ──────────► onResize ─────► live preview of mainHeight or mainWidth
mouseup ───────► onResizeEnd ──► write mainHeight (column) or mainWidth (row) in px
                                 NEVER writes top/left/width/height.
```

### 5e. Move a Flex Container itself on the canvas (react-moveable)

The Flex Container is a normal grid widget in its parent. `onDrag` / `onDragEnd` / `onResize` follow the existing react-moveable + grid pipeline unchanged. Only its **children** take the flex path.

### Library boundary (critical)

- **react-dnd** fires only at the moment a widget is first dropped from the right-side widget manager. After that, react-dnd never participates again for that widget instance.
- **react-moveable** owns **every** drag and resize of an existing canvas widget — including reorder inside a Flex Container, drag-out from a Flex Container, drag of the Flex Container itself, and main-axis resize of a Flex Container child.
- No third drag library. Two libraries only: react-dnd (first drop) + react-moveable (everything else).

---

## 6. Library / DnD strategy

Two libraries. No more.

react-dnd fires only at first-drop from the right-side widget manager. After a widget exists on the canvas, react-moveable owns all drag and resize — including intra-Flex-Container reorder. Reorder is detected by computing the insertion slot from mouse coordinates during `onDrag`, updating the drop indicator via `gridSlice.flexContainerDropTarget`, and writing the new `order` on `onDragEnd`.

| Interaction | Library |
|---|---|
| First drop from widget panel onto canvas / into a Flex Container | `react-dnd` (existing `useDrop` in `Container.jsx`) |
| **Reorder children already inside a Flex Container** | **`react-moveable`** — insertion slot computed from mouse coords in `onDrag`; order written in `onDragEnd` |
| Drag a Flex Container child OUT to canvas | `react-moveable` (existing) + reparenting via `flexContainerDragEnd.js` |
| Drag the Flex Container itself on the canvas | `react-moveable` (existing, unchanged) |
| Resize a Flex Container child (main axis only) | `react-moveable` (existing, `renderDirections=['s']` vertical / `['e']` horizontal) |
| Resize the Flex Container itself | `react-moveable` (existing, all 4 directions) |

Rationale: react-moveable already fires `onDrag` for every canvas widget drag — flex children included. Reorder is a side effect of detecting insertion slot during that drag and writing `order` on drop. No third library, no separate grab handle, no sortable context. Simpler.

---

## 7. Reuse from existing code

- `react-dnd` `useDrop` flow inside `Container.jsx` — drop hit-testing reused unchanged for the **first-drop-from-widget-panel** case only.
- `react-moveable` pipeline in `Grid.jsx` — owns every post-drop drag and resize. We add per-target branching (`renderDirections`, Flex-Container-child `onDrag` / `onResizeEnd` paths) but do not fork the pipeline.
- `findNewParentIdFromMousePosition` at `gridUtils.js:657` — unchanged. Insertion index computed separately via `getFlexChildRects` + `computeInsertionIndex`.
- `setComponentLayout` at `componentsSlice.js:1560` — branched on parent type.
- `containerChildrenMapping` already an ordered array — sort by `order` on insert; otherwise unchanged.
- `useDropVirtualMoveableGhost` and `GhostWidgets.jsx` — used as-is for visual drag feedback during react-moveable drags.

---

## 8. Edge cases

| Case | Handling |
|---|---|
| Empty Flex Container | `FlexContainerEmptyPlaceholder` renders with insertion `index = 0` baked in. |
| Single child | Two slots only (above, below); algorithm degenerates correctly. |
| Nested Flex Containers | `findNewParentIdFromMousePosition` deepest-wins by z-order (existing behavior). Drop indicator scoped to the deepest hovered Flex Container. |
| Flex Container inside Flex Container | Outer treats inner as a single flex child. Inner has its own `mainHeight`/`mainWidth` or `fillMain`. |
| Drag a Flex Container onto canvas | Drags as a normal grid widget (it has top/left/width/height). |
| Multi-select drag mixing Flex Container & grid children | MVP limitation: filter such selections at drag-start; require a single drag mode. Documented v2 follow-up. |
| Mobile layout | `gap` / `padding` overridable per layout. `mainHeight` / `mainWidth` / `order` / `fillMain` stored per-layout key. |
| Content overflow | Outer bounds fixed (user-set on grid). Vertical + wrap off: `overflow-y: auto`. Horizontal + wrap off: `overflow-x: auto`. Either direction + wrap on: natural flex wrap, no overflow scroll. |

---

## 9. Code style

- **Language:** JavaScript (`.jsx`). Match patterns in `Container.jsx`.
- **Components:** Functional + hooks. No class components.
- **Store access:** Zustand selectors with `shallow` equality where multi-key selection is used (especially `FlexContainerDropIndicator` `[flexContainerId, index]` selector).
- **Styling:** Match `Container.jsx` (inline / className conventions in that file). Do not introduce a new CSS strategy.
- **No new dependencies.** Zero. react-dnd and react-moveable already in the project.
- **Pure helpers** in `flexContainer.utils.js` — no React imports.
- **rAF throttling** for both `useDrop.hover` (first-drop from panel) and `Grid.jsx onDrag` (moveable reorder) writes to `gridSlice.flexContainerDropTarget`.
- **Naming:** `componentType === 'FlexContainer'` everywhere — internal symbol, file names, identifiers, and user-facing label all use "Flex Container" / `FlexContainer`. No "Stack" anywhere in code or docs except the existing git branch name.

---

## 10. Testing strategy

**Manual verification only for MVP.** No unit, integration, or E2E tests in this scope.

### Acceptance verification (manual)

Run `cd frontend && npm start` and walk through:

1. **Add Flex Container** from widget manager. Confirm it appears as a regular grid widget on canvas, resizable in all 4 directions on its outer rect.
2. **Drag a Button into the empty Flex Container.** Verify empty placeholder visible; dropping inserts the button as a flex child stretched to full width; button becomes the last (and only) child.
3. **Drag a second Button.** Verify it appends as the new last child by default.
4. **Reorder.** Select child #2 and drag it above child #1 within the Flex Container using the standard moveable drag handle — verify the 2px drop-line indicator follows the cursor and snaps to insertion midpoints; drop and confirm `order` placement reflects the new sequence.
5. **Resize a Flex Container child.** Confirm only the south handle is shown; height changes in px; width stays at 100%; siblings below shift down.
6. **Drag a Flex Container child OUT** onto the canvas. Confirm it reverts to absolute positioning with sensible default `top/left/width/height`.
7. **Nested Flex Container.** Place one inside another. Verify drop indicator scopes to the deepest hovered Flex Container; inner reflows correctly.
8. **Inspector.** Change `gap`, `padding`, `justify`, `align` — verify live updates and persistence after reload.
9. **Overflow.** Add enough children to exceed inner height; verify inner flex container scrolls (`overflow-y: auto`) without breaking outer bounds.
10. **Mobile layout switch.** Confirm Flex Container still renders as flex on mobile; layout-keyed `mainHeight` / `mainWidth` / `order` apply correctly.
11. **No regressions.** Existing Container, Form, Tabs, Modal — drag/drop and absolute positioning unchanged.

### Acceptance gates (must hold for MVP merge)

- **Latency:** Drop indicator updates within one `requestAnimationFrame` (≤16ms) of cursor move.
- **Reorder = single store mutation.** `reorderFlexContainerChild` updates `order` and resorts `containerChildrenMapping` in one history entry. Verify via Redux/Zustand devtools.
- **No regression** on existing Container / Form / Tabs / Modal drag/drop and absolute positioning.
- **Schema additive.** Open an existing app saved before this change — loads with no errors and no layout drift.

---

## 11. Boundaries

### Always

- Schema additive only — no migration of existing apps.
- Reuse `setComponentLayout`, `containerChildrenMapping`, existing react-dnd drop pipeline.
- Branch behavior by `parent.component === 'FlexContainer'` (the layout-mode boundary).
- Throttle hover-driven store writes to one per `requestAnimationFrame`.
- Flex Container child layouts only ever store `{order, mainHeight|mainWidth, fillMain, crossAlignSelf}` — never `top/left/width/height`. Only the direction-relevant `mainHeight`/`mainWidth` field is written per child.
- Use the name "Flex Container" / `FlexContainer` everywhere — code, schema, file paths, inspector labels.

### Ask first

- Any change to `WidgetWrapper.jsx` (deliberately off the critical path).
- Any schema migration that touches existing app data.
- Adding new `direction` values beyond `'column'` and `'row'`.
- Adding undo/redo coverage for Flex-Container-specific operations (deferred — needs separate scoping).
- Any new npm dependency.

### Never

- Fork the drag/resize pipeline. Branch where needed; do not duplicate.
- Write `top/left/width/height` for a Flex Container child.
- Break absolute positioning for any non-Flex-Container widget.
- Convert existing Container / Form / Tabs / Modal children to flex layout.
- Skip the layout-mode boundary check (`parent.component === 'FlexContainer'`) — every interaction site must branch consistently.
- Use the name "Stack" anywhere in code, identifiers, file paths, or docs (existing git branch name `Stack-component` is the only allowed exception).

---

## 12. Commands

(Reference only — not run as part of this spec.)

| Purpose | Command |
|---|---|
| Run editor locally | `cd frontend && npm start` |
| Build | `cd frontend && npm run build` |
| Lint | `cd frontend && npm run lint` |

---

## 13. Risks

1. **Moveable per-target config.** Per-target `renderDirections` is supported by `react-moveable` but rarely used in this codebase. Validate selection-handle visuals before+after.
2. **px (Flex Container child) vs grid units (everything else).** Ensure the schema serializer/deserializer treats `mainHeight` and `mainWidth` as px without conversion. Direction-keying means only the relevant field is written per child; the other is absent.
3. **Moveable reorder vs react-dnd first-drop collision.** During `onDrag` for a flex child, the react-dnd `useDrop.hover` on `Container.jsx` will also fire if the mouse re-enters the Flex Container. This is fine — `useDrop.hover` only writes `flexContainerDropTarget` (same value moveable `onDrag` writes). No functional conflict; just verify the rAF throttle doesn't cause a stale indicator on fast drags.
4. **Deferred follow-ups.** Dynamic-height auto-grow and undo/redo coverage land in a follow-up. Until then, users must size Flex Container manually on the grid; Flex-Container-specific operations may not undo cleanly.

---

## 14. Open questions for follow-up scoping

- Auto-grow Flex Container outer bounds when children overflow (both axes).
- Undo/redo wiring for `reorderFlexContainerChild` and into/out-of-Flex-Container reparents.
- Multi-select drag mixing Flex Container and grid children.
- Multi-line wrap layout: `align-content` property for controlling row/column spacing when `flexWrap=true`.

---

## 15. Row direction addendum

This section specifies the delta between column-only MVP and full `direction: 'row'` support. All column behavior is unchanged. Row shares the same infrastructure — only the axis-dependent branching changes.

### 15.1 Schema changes

`mainSize` is replaced by two direction-keyed fields:

| Field | Written when | Value |
|---|---|---|
| `mainHeight` | parent `direction='column'` | px height; ignored when `fillMain=true` |
| `mainWidth` | parent `direction='row'` | px width; ignored when `fillMain=true` |

New container-level field stored on Flex Container widget properties:

| Field | Type | Default | Notes |
|---|---|---|---|
| `flexWrap` | boolean | `false` | Maps to CSS `flex-wrap: nowrap` (false) / `wrap` (true) |

Schema is **purely additive**. `mainSize` is retired — no existing saved apps use it (column MVP hasn't shipped). Strip `mainSize` in `stripFlexContainerLayoutFields`.

### 15.2 Inspector changes (`flexContainer.js`)

- `direction` Select: options `['column', 'row']`, both enabled. Remove disabled state and "Row coming soon" tooltip.
- Add `flexWrap` Toggle (label: "Wrap", default `false`) below `align`. Visible for both directions.
- No new per-child properties for horizontal MVP. `fillMain` and `crossAlignSelf` apply to horizontal children identically (main axis = X, cross axis = Y).

### 15.3 `FlexContainer.jsx` changes

```jsx
// direction prop maps directly to CSS flex-direction
const flexDirection = direction; // 'row' | 'column'

// flexWrap prop drives flex-wrap
const flexWrapStyle = flexWrap ? 'wrap' : 'nowrap';

// overflow: only active when wrap is off
const overflowStyle = flexWrap
  ? {}
  : direction === 'row'
  ? { overflowX: 'auto' }
  : { overflowY: 'auto' };
```

Cross-axis sizing for horizontal children: `height: 100%` on each child (cross-axis = vertical). `align: stretch` (default) achieves this via flexbox; no explicit `height` write needed.

### 15.4 `Grid.jsx` handle changes

```js
// Per-target renderDirections
const isFlexContainerChild = parent?.component === 'FlexContainer';
const parentDirection = parent?.properties?.direction ?? 'column';

renderDirections = isFlexContainerChild
  ? parentDirection === 'row' ? ['e'] : ['s']
  : ['n', 'nw', 'ne', 's', 'sw', 'se', 'e', 'w'];
```

`onResizeEnd` for row child: write `mainWidth` (px) only — never `mainHeight`, `top`, `left`, `width`, `height`.

### 15.5 `computeInsertionIndex` changes (`flexContainer.utils.js`)

```js
// direction-aware insertion index
function computeInsertionIndex(rects, mousePos, direction) {
  const axis = direction === 'row' ? 'left' : 'top';
  const size = direction === 'row' ? 'width' : 'height';
  // binary search over rect midpoints on the relevant axis
  for (let i = 0; i < rects.length; i++) {
    const mid = rects[i][axis] + rects[i][size] / 2;
    if (mousePos[direction === 'row' ? 'x' : 'y'] < mid) return i;
  }
  return rects.length;
}
```

`Container.jsx` `useDrop.hover` (first-drop) and `Grid.jsx` `onDrag` (moveable reorder) both pass `direction` from container props when calling `computeInsertionIndex`.

### 15.6 `FlexContainerDropIndicator.jsx` changes

Indicator orientation driven by parent `direction`:

| direction | Line orientation | Dimension |
|---|---|---|
| `column` | horizontal line | `width: 100%`, `height: 2px` |
| `row` | vertical line | `width: 2px`, `height: 100%` |

Positioned absolutely between children. Circular caps remain on both ends (rotate 90° for vertical line).

### 15.7 `flexContainerDragEnd.js` changes

On `onDragEnd` into row Flex Container: write `mainWidth` (measured from `onResize` last width px) instead of `mainHeight`. All other logic (order, strip, synthesize grid layout on drag-out) unchanged.

### 15.8 Acceptance verification — row-specific steps

Run `cd frontend && npm start` and walk through after completing all column verification steps:

1. **Switch to row.** Create a Flex Container, change `direction` to `row` in Inspector. Confirm children stack left-to-right.
2. **Drop widgets.** Confirm children fill full height (cross-axis 100%); `gap` and `padding` apply on X axis.
3. **Reorder in row.** Drag child within row Flex Container — verify 2px vertical drop-line indicator appears between children; snaps to insertion midpoints on X axis.
4. **East-handle resize.** Select a child — confirm only east (`e`) handle visible. Drag to resize; confirm `mainWidth` changes in px; siblings shift right.
5. **Fill main.** Toggle `fillMain` on one child — confirm it expands to fill remaining horizontal space (`flex: 1 1 0`).
6. **Flex wrap off (default).** Add enough children to exceed container width — confirm `overflow-x: auto` scroll activates; no wrap.
7. **Flex wrap on.** Toggle `Wrap` in Inspector — confirm `overflow-x` removed, children wrap to next line.
8. **Drag child out.** Drag a row Flex Container child to canvas — confirm absolute layout synthesized; `mainWidth` / `mainHeight` stripped.
9. **Nested directions.** Place a column Flex Container inside a row one — confirm outer treats inner as single flex child with `mainWidth`; inner `flex-direction` is `column`.
10. **No column regressions.** Switch existing column Flex Container to `row` and back — confirm `mainHeight` field is absent on re-inspect; `mainWidth` absent when column.

### 15.9 Row-specific risks

1. **`mainWidth` / `mainHeight` field co-existence.** A child dragged from a column into a row Flex Container will have a stale `mainHeight` field. `stripFlexContainerLayoutFields` must clear both when exiting any Flex Container. On entry, only the direction-relevant field is written.
2. **East handle + existing resize pipeline.** `renderDirections=['e']` is less battle-tested than `['s']`. Validate handle position against flex child bounds — child bounds are determined by flexbox flow, not absolute coords.
3. **Wrap mode + drop indicator.** When `flexWrap=true`, children span multiple rows/columns. `computeInsertionIndex` is a flat list; wrapped layout means rect order on screen may not match DOM order. MVP: drop into wrapped Flex Container always appends (index = last); insertion line disabled when wrap is on. Documented v2 follow-up.
4. **Cross-axis height = 100%.** `align: stretch` (default) gives `height: 100%` on row children via flexbox. If user changes `align` to `flex-start`, children hug content height. This is correct behavior — just document it in Inspector tooltip for `align`.
