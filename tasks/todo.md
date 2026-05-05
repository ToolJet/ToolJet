# Flex Container — Task List

> Plan: `tasks/plan.md` · Spec: `SPEC.md` · Library contract: react-dnd (first drop) + react-moveable (everything else). No dnd-kit.

---

## Phase A — Registry + Widget Shell
*Checkpoint: Widget appears in panel, drops to canvas as empty grid widget that renders the flex shell + empty placeholder.*

- [ ] **A1** `appCanvasConstants.js` — add `'FlexContainer'` to `DROPPABLE_PARENTS` Set (line ~59) and `SUBCONTAINER_WIDGETS` array (line ~40)
- [ ] **A2** `WidgetManager/widgets/flexContainer.js` *(new)* — full inspector schema: `direction` (column/row, both enabled), `gap`, `padding`, `justify`, `align`, `flexWrap` toggle; styles section; defaults
- [ ] **A3** Wire registration: export from `WidgetManager/widgets/index.js`, import + add to `widgets` array in `WidgetManager/configs/widgetConfig.js`
- [ ] **A4** `Widgets/FlexContainer/FlexContainer.jsx` *(new)* — runtime shell: inner div with `display:flex`, direction-aware overflow (column→`overflow-y`, row→`overflow-x`, `flexWrap=true`→none), `real-canvas` class + `data-parentId` for hit testing
- [ ] **A5** `Widgets/FlexContainer/FlexContainerEmptyPlaceholder.jsx` *(new)* — 64px dashed CTA, visible iff `childIds.length === 0`, `pointer-events: none`
- [ ] **A-CHECK** Manual: appears in panel · drag → grid widget with `{top,left,width,height}` · placeholder renders · outer rect resizes 4-directionally · no console errors

---

## Phase B — Store
*Checkpoint: Store handles flex schema correctly. Direction-keyed `mainHeight`/`mainWidth`. No `top/left/width/height` for FC children.*

- [ ] **B1** `gridSlice.js` — add `flexContainerDropTarget: null` to initial state + `setFlexContainerDropTarget` action
- [ ] **B2** `componentsSlice.js` (~line 1560) — add FlexContainer parent-type branch in `setComponentLayout`: write only `{order, mainHeight|mainWidth, fillMain, crossAlignSelf}`; strip absolute fields; strip stale opposite-direction main-axis key; splice into `containerChildrenMapping[fcId]` at `insertIndex` then sort by `order`
- [ ] **B2b** Same function, non-FC parent branch — also strip flex-only fields (`order`, `mainHeight`, `mainWidth`, `fillMain`, `crossAlignSelf`) for drag-out cleanup
- [ ] **B3** `componentsSlice.js` — add `reorderFlexContainerChild(flexContainerId, componentId, newIndex)` action: re-assigns sparse orders (1000, 2000, …), resorts mapping, single history entry via `withUndoRedo`
- [ ] **B-CHECK** Zustand devtools: `flexContainerDropTarget` exists as `null` · `setComponentLayout` with FC parent writes `order` not `top/left` · direction switch drops stale `mainHeight`/`mainWidth` on next write

---

## Phase C — First-drop path (react-dnd)
*Checkpoint: Drop widget from panel into FC → appended as last child. Drop indicator updates ≤ one rAF.*

- [ ] **C1** `Widgets/FlexContainer/flexContainer.utils.js` *(new)* — pure helpers:
  - [ ] `computeInsertionIndex(rects, mousePos, direction)` — direction-aware (mouseY for column, mouseX for row)
  - [ ] `synthesizeGridLayoutFromDrop(clientX, clientY, canvasRect, gridWidth, defaults)`
  - [ ] `stripFlexContainerLayoutFields(layout)` — strips `order`, `mainHeight`, `mainWidth`, `fillMain`, `crossAlignSelf`
  - [ ] `getFlexChildRects(flexContainerId)` — DOM read of `:scope > .flex-child-wrapper` rects
- [ ] **C2** `Container.jsx` — add `componentType === 'FlexContainer'` branch (`FlexContainerHost`):
  - [ ] `useDrop.hover` (rAF-throttled) caches rects on first hover, computes insertion idx, writes `setFlexContainerDropTarget`
  - [ ] `useDrop.drop` computes final idx, writes `{order: maxOrder + 1000, insertIndex}` via `setComponentLayout`, clears drop target, clears rects cache
  - [ ] Empty FC: skip indicator write when rects empty (placeholder fills the role); first drop inserts at index 0
  - [ ] `useEffect` cleanup nulls drop target on unmount
- [ ] **C3** `Widgets/FlexContainer/FlexContainerDropIndicator.jsx` *(new)* — direction-aware orientation (column → horizontal line full-width 2px tall; row → vertical line full-height 2px wide); subscribes to `flexContainerDropTarget` with `[flexContainerId, index]` selector + `shallow`; circular caps; `pointer-events: none`
- [ ] **C-CHECK** Manual: hover empty FC → placeholder, no indicator · drop → child has `{order: 1000}` only · hover populated FC → indicator snaps to midpoints · drop → correct insertion index in `containerChildrenMapping`

---

## Phase D — Child rendering
*Checkpoint: Children render as flex items with correct cross-axis stretch and main-axis sizing.*

- [ ] **D1** `Widgets/FlexContainer/FlexContainerChildWrapper.jsx` *(new)* — direction-aware sizing:
  - [ ] `flex: fillMain ? '1 1 0' : (basis ? '0 0 ${basis}px' : '0 0 auto')`
  - [ ] cross-axis: `width: 100%` (column) / `height: 100%` (row)
  - [ ] `alignSelf: crossAlignSelf || undefined`
  - [ ] Carries `target widget-target moveable-box flex-child-wrapper` classes (react-moveable target selection)
  - [ ] `data-component-id={componentId}` for moveable lookup
  - [ ] Owns `ConfigHandle`
  - [ ] Uses Zustand selector with `shallow` for layout fields
- [ ] **D2** `Widgets/FlexContainer/FlexContainer.jsx` — replace placeholder children map with `FlexContainerChildWrapper` per `childId`; render `FlexContainerDropIndicator` inside inner flex container (absolutely positioned)
- [ ] **D3** `Grid/gridUtils.js` — export `getFlexContainerInsertIndex(flexContainerId, clientX, clientY, direction)` thin wrapper over `getFlexChildRects` + `computeInsertionIndex`
- [ ] **D-CHECK** Manual: dropped children stretch full cross-axis · `mainHeight`/`mainWidth` set via devtools reflows main-axis · `fillMain=true` → child grows · `ConfigHandle` aligned to flex bounds · inspector opens for FC children

---

## Phase E — react-moveable adjustments
*Checkpoint: Drag-out, reparent, resize work correctly for FC children. Per-axis resize handle.*

- [ ] **E1** `Grid/Grid.jsx` — `renderDirections` per target via function form: `['s']` when FC child + parent column, `['e']` when FC child + parent row, all 8 otherwise. Helpers: `isFlexChild(target)`, `flexParentDirection(target)`
- [ ] **E2** `Grid/Grid.jsx onDrag` — for FC children: skip grid-snap `setStyle({top,left})` writes; apply free transform on the moveable element so ghost follows cursor
- [ ] **E3** `Grid/Grid.jsx onResizeEnd` — for FC children: write `mainWidth` (row) or `mainHeight` (column) px only; never `top/left/width/height`
- [ ] **E4** `Grid/helpers/flexContainerDragEnd.js` *(new)* — three-case dispatch:
  - [ ] **Case 1** same FC → reorder (Phase F populates this branch)
  - [ ] **Case 2** different FC → `setComponentLayout` with `{order: maxOrder + 1000, insertIndex}` for new parent
  - [ ] **Case 3** out to canvas → strip flex fields, synthesize grid layout via `synthesizeGridLayoutFromDrop`
  - [ ] Clear `flexContainerDropTarget` after each case
- [ ] **E5** `Grid/Grid.jsx onDragEnd` — route through `handleFlexContainerDragEnd` when `sourceIsFlexContainer || targetIsFlexContainer`
- [ ] **E-CHECK** Manual: south handle only on column-FC child · east handle only on row-FC child · resize → direction-keyed px write · drag-out → absolute layout, all flex fields stripped · drag from FC A to FC B → child appears at insertion index in B with new `order`

---

## Phase F — Intra-FC reorder via react-moveable
*Checkpoint: Reorder works, single store mutation, no Moveable interference.*

- [ ] **F1** `Grid/Grid.jsx onDrag` — when target is FC child + cursor still inside source FC bounds: rAF-throttled `setFlexContainerDropTarget({fcId, index})` via `getFlexContainerInsertIndex`. When cursor leaves FC bounds → `setFlexContainerDropTarget(null)`
- [ ] **F2** Verify Case 1 in `flexContainerDragEnd.js` dispatches `reorderFlexContainerChild` exactly once. Single Zustand history entry.
- [ ] **F3** Confirm `FlexContainerDropIndicator` already subscribes correctly; both react-dnd hover (Phase C) and moveable onDrag write the same shape. `onDragEnd` always nulls target.
- [ ] **F-CHECK** Manual: drag child #2 above child #1 → 2px indicator snaps to midpoints · release → `reorderFlexContainerChild` once in devtools · `containerChildrenMapping` reflects new order · no `top/left` written · resize handles do not appear during drag

---

## Phase G — Inspector polish + edge cases
*Checkpoint: Final acceptance verification per SPEC §10 + §15.8.*

- [ ] **G1** `RightSideBar/Inspector/Components/FlexChildLayoutPanel.jsx` *(file already untracked in git status — verify wiring)*:
  - [ ] `fillMain` toggle
  - [ ] `crossAlignSelf` select (`flex-start | center | flex-end | stretch`)
  - [ ] Hide `top/left/width/height` for FC children
  - [ ] Show only direction-relevant main-axis size field (`mainHeight` for column, `mainWidth` for row)
- [ ] **G2** Verify mobile layout keying: switch layout → `mainHeight`/`mainWidth`/`order`/`fillMain`/`crossAlignSelf` stored under `layouts[currentLayout]`
- [ ] **G3** Verify overflow + flexWrap behaviour:
  - [ ] `flexWrap=false` + column → `overflow-y: auto` activates
  - [ ] `flexWrap=false` + row → `overflow-x: auto` activates
  - [ ] `flexWrap=true` → no scroll, children wrap; insertion indicator disabled, drops always append (documented v2 follow-up)
- [ ] **G4** Verify nested FC: outer column + inner row → outer treats inner as single flex child with `mainHeight`; deepest-wins drop indicator scoping
- [ ] **G5** Verify class isolation: existing Container/Form/Tabs/Modal drag/drop unchanged; existing apps load without errors or drift

### Final acceptance — SPEC §10 (column path)
- [ ] 1 · Add FC → grid widget, all 4 resize directions
- [ ] 2 · Drop Button into empty FC → placeholder, drops as last child stretched full width
- [ ] 3 · Drop second Button → appends as last child
- [ ] 4 · Reorder #2 above #1 → indicator, correct order, single store mutation
- [ ] 5 · Resize → south handle only, `mainHeight` px, siblings shift, no `top/left/width` written
- [ ] 6 · Drag child OUT → absolute positioning with `top/left/width/height`
- [ ] 7 · Nested FC → indicator scopes to deepest, inner reflows
- [ ] 8 · Inspector `gap`/`padding`/`justify`/`align` → live updates + persist on reload
- [ ] 9 · Overflow → inner scrolls, outer bounds intact
- [ ] 10 · Mobile layout switch → flex active, fields layout-keyed
- [ ] 11 · No regressions on Container/Form/Tabs/Modal

### Final acceptance — SPEC §15.8 (row path)
- [ ] 12 · Switch direction `row` → children stack left-to-right
- [ ] 13 · Drop widgets → full height, `gap`/`padding` on X
- [ ] 14 · Reorder in row → 2px vertical drop-line snaps on X axis
- [ ] 15 · East-handle resize → only `e` handle, `mainWidth` px, siblings shift right
- [ ] 16 · `fillMain` toggle → child fills remaining horizontal space
- [ ] 17 · `flexWrap=false` + row → `overflow-x: auto` activates
- [ ] 18 · `flexWrap=true` + row → wrap on, no overflow scroll
- [ ] 19 · Drag row child OUT → absolute layout, both `mainHeight` + `mainWidth` stripped
- [ ] 20 · Nested directions → outer treats inner as single flex child with `mainWidth`
- [ ] 21 · Switch `column → row → column` on populated FC → stale `mainHeight`/`mainWidth` absent on re-inspect

---

## Acceptance gates (must hold for MVP merge)
- [ ] Drop indicator updates ≤ 1 rAF (≤16ms) of cursor move
- [ ] `reorderFlexContainerChild` = single store mutation (one history entry)
- [ ] No regression on existing Container / Form / Tabs / Modal
- [ ] Schema additive — pre-existing apps load with zero layout drift

---

## Deferred (not this iteration — SPEC §2 + §14)
- [ ] Dynamic-height auto-grow for FC outer height
- [ ] Undo/redo coverage for `reorderFlexContainerChild` and reparent ops
- [ ] Multi-select drag mixing FC + grid children
- [ ] Insertion line during `flexWrap=true` reorder
- [ ] Automated unit / integration / E2E tests
