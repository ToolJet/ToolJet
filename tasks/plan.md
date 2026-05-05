# Flex Container — Implementation Plan

> Spec: `/SPEC.md` · Branch: `Stack-component` · Working dir: `frontend/`
> Library contract: **react-dnd** (first drop only) + **react-moveable** (every post-drop drag/resize). **No dnd-kit.**

---

## Pre-implementation findings (read-only research)

| Finding | Impact on plan |
|---|---|
| `SUBCONTAINER_WIDGETS` array at `appCanvasConstants.js:40` requires `'FlexContainer'` in addition to `DROPPABLE_PARENTS` (line 59) | Both adds in Phase A1 |
| `findNewParentIdFromMousePosition` (`gridUtils.js:657`) uses class `target` + `real-canvas` + `data-parentId` for hit detection | FlexContainer DOM must emit these classes/attrs in inner element |
| `containerChildrenMapping` is `{ [parentId]: string[] }`, push-only and **insertion-ordered** today | Insert path must `splice(insertIndex, 0, id)` and post-sort by `order` |
| `gridSlice` initial state has no drop-target field | Phase B1 adds `flexContainerDropTarget` |
| `setComponentLayout` (`componentsSlice.js:1560`) merges layout fields with `...spread`; no parent-type branching | Phase B2 introduces explicit FlexContainer branch |
| Widget registration: `widgetConfig.js` imports configs and exports a `widgets` array consumed by the manager | A3 wires `flexContainerConfig` here |
| `useDropVirtualMoveableGhost` + `GhostWidgets.jsx` already give visual ghost during moveable drags | Reused as-is — no fork |
| `react-moveable` per-target props are supported (`renderDirections` may be a function or per-target) | E1 uses per-target form |

No new npm dependency. Two libraries only: react-dnd + react-moveable.

---

## Dependency graph

```
[A] Registry + Widget shell  (renderable empty widget)
        │
        ▼
[B] Store schema             (gridSlice + componentsSlice direction-aware)
        │
        ▼
[C] First drop from panel    (react-dnd hover/drop, insertion line)
        │
        ▼
[D] Child rendering          (FlexContainerChildWrapper, direction-aware sizing)
        │
        ▼
[E] Moveable adjustments     (per-axis handles, drag-out, resize)
        │
        ▼
[F] Intra-FC reorder         (insertion-slot during onDrag → reorder action)
        │
        ▼
[G] Inspector polish + edges (flexWrap, mobile, overflow, nested)
```

Each phase is a vertical slice — by its checkpoint, the user can manually verify one complete behavior end-to-end. Within a phase, files can be modified in parallel.

---

## Phase A — Registry + Widget Shell

**Goal:** "Flex Container" appears in the widget panel; dragging it onto the canvas creates an empty grid widget that renders the flex shell + empty placeholder.

### A1 — Constants registration
**File:** `frontend/src/AppBuilder/AppCanvas/appCanvasConstants.js`
- Add `'FlexContainer'` to `DROPPABLE_PARENTS` Set (line ~59)
- Add `'FlexContainer'` to `SUBCONTAINER_WIDGETS` array (line ~40)

### A2 — Widget manager config (skeleton)
**File:** `frontend/src/AppBuilder/WidgetManager/widgets/flexContainer.js` *(new)*

Schema-complete config shipped here in A2 (so Phase G has only verification work). Direction options `['column', 'row']` both enabled. `flexWrap` toggle present.

```js
export const flexContainerConfig = {
  name: 'FlexContainer',
  displayName: 'Flex Container',
  description: 'Auto-layout flex container',
  defaultSize: { width: 15, height: 300 },
  component: 'FlexContainer',
  others: {
    showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
    showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
  },
  properties: {
    direction: {
      type: 'select',
      displayName: 'Direction',
      options: [
        { name: 'Column', value: 'column' },
        { name: 'Row', value: 'row' },
      ],
    },
    gap:     { type: 'number', displayName: 'Gap',     validation: { min: { value: 0 } } },
    padding: { type: 'number', displayName: 'Padding', validation: { min: { value: 0 } } },
    justify: {
      type: 'select',
      displayName: 'Justify',
      options: ['flex-start','center','flex-end','space-between','space-around']
        .map(v => ({ name: v, value: v })),
    },
    align: {
      type: 'select',
      displayName: 'Align',
      options: ['flex-start','center','flex-end','stretch']
        .map(v => ({ name: v, value: v })),
    },
    flexWrap: { type: 'toggle', displayName: 'Wrap' },
  },
  styles: {
    backgroundColor: { type: 'colorSwatches',  displayName: 'Background color' },
    borderColor:     { type: 'colorSwatches',  displayName: 'Border color' },
    borderRadius:    { type: 'numberInput',    displayName: 'Border radius' },
    boxShadow:       { type: 'boxShadow',      displayName: 'Box shadow' },
  },
  exposedVariables: { isVisible: true },
  events: {},
  definition: {
    others: { showOnDesktop: { value: '{{true}}' }, showOnMobile: { value: '{{false}}' } },
    properties: {
      direction: { value: 'column' },
      gap:       { value: '8' },
      padding:   { value: '12' },
      justify:   { value: 'flex-start' },
      align:     { value: 'stretch' },
      flexWrap:  { value: '{{false}}' },
    },
    styles: {
      backgroundColor: { value: '#ffffff' },
      borderRadius:    { value: '0' },
      borderColor:     { value: '#cccccc' },
      boxShadow:       { value: 'none' },
    },
    events: [],
  },
};
```

### A3 — Wire registration
- Export `flexContainerConfig` from `frontend/src/AppBuilder/WidgetManager/widgets/index.js`
- Import + add to `widgets` array in `frontend/src/AppBuilder/WidgetManager/configs/widgetConfig.js`

### A4 — Runtime shell
**File:** `frontend/src/AppBuilder/Widgets/FlexContainer/FlexContainer.jsx` *(new)*

Minimal shell. No child interaction yet — but DOM emits `real-canvas` class + `data-parentId` so `findNewParentIdFromMousePosition` already hit-tests it.

```jsx
const FlexContainer = ({ id, properties, styles }) => {
  const { direction = 'column', gap = 8, padding = 12, justify, align, flexWrap = false } = properties;
  const childIds = useStore(s => s.containerChildrenMapping[id] ?? [], shallow);

  const overflowStyle = flexWrap
    ? {}
    : direction === 'row' ? { overflowX: 'auto' } : { overflowY: 'auto' };

  return (
    <div className="flex-container-widget" style={{ width: '100%', height: '100%', ...styles }}>
      <div
        className="flex-container-inner real-canvas"
        data-parentId={id}
        style={{
          display: 'flex',
          flexDirection: direction,
          flexWrap: flexWrap ? 'wrap' : 'nowrap',
          gap: `${gap}px`,
          padding: `${padding}px`,
          justifyContent: justify,
          alignItems: align,
          height: '100%',
          width: '100%',
          ...overflowStyle,
        }}
      >
        {childIds.length === 0 && <FlexContainerEmptyPlaceholder direction={direction} />}
        {/* Phase D wires FlexContainerChildWrapper per child + DropIndicator */}
      </div>
    </div>
  );
};
```

### A5 — Empty placeholder
**File:** `frontend/src/AppBuilder/Widgets/FlexContainer/FlexContainerEmptyPlaceholder.jsx` *(new)*

64px dashed CTA. Rendered only when `childIds.length === 0`. Insertion `index = 0` is implicit. `pointer-events: none` so it doesn't block react-dnd hit testing.

### Acceptance — Phase A checkpoint
- [ ] Flex Container appears in widget manager panel under correct category
- [ ] Drag from panel → canvas creates a grid widget with `{top, left, width, height}` in `layouts[currentLayout]`
- [ ] Renders as empty box with the placeholder CTA
- [ ] Outer rect resizable in all 4 directions (Flex Container itself = normal grid widget in its parent)
- [ ] No console errors; no hot-reload warnings on `data-parentId`/`real-canvas` classes

---

## Phase B — Store

**Goal:** Store can hold and update FlexContainer-specific layout fields. Direction-keyed `mainHeight`/`mainWidth` written; `top/left/width/height` never written for FC children.

### B1 — `gridSlice.flexContainerDropTarget`
**File:** `frontend/src/AppBuilder/_stores/slices/gridSlice.js`

```js
// initialState additions
flexContainerDropTarget: null, // { flexContainerId: string, index: number } | null

// action
setFlexContainerDropTarget: (payload) => set({ flexContainerDropTarget: payload }),
```

### B2 — `componentsSlice.setComponentLayout` parent-type branch
**File:** `frontend/src/AppBuilder/_stores/slices/componentsSlice.js` (~line 1560)

After resolving `newParentId`, branch on parent component type:

```js
const parentComp = page.components[newParentId]?.component?.component;
const isFlexParent = parentComp === 'FlexContainer';
const flexDir = page.components[newParentId]?.component?.definition?.properties?.direction?.value ?? 'column';

if (isFlexParent) {
  // Direction-keyed main-axis size
  const mainKey = flexDir === 'row' ? 'mainWidth' : 'mainHeight';
  const otherMainKey = flexDir === 'row' ? 'mainHeight' : 'mainWidth';

  const next = { ...component.layouts[currentLayout] };
  // strip absolute fields
  delete next.top; delete next.left; delete next.width; delete next.height;
  // strip stale main-axis field from previous direction (if any)
  delete next[otherMainKey];
  // apply incoming flex-only fields
  if (layout.order        !== undefined) next.order        = layout.order;
  if (layout[mainKey]     !== undefined) next[mainKey]     = layout[mainKey];
  if (layout.fillMain     !== undefined) next.fillMain     = layout.fillMain;
  if (layout.crossAlignSelf !== undefined) next.crossAlignSelf = layout.crossAlignSelf;
  component.layouts[currentLayout] = next;

  // Maintain mapping sorted by order, splice at insertIndex when supplied
  const mapping = state.containerChildrenMapping[newParentId] ?? [];
  const without = mapping.filter(cid => cid !== componentId);
  const insertAt = layout.insertIndex ?? without.length;
  without.splice(insertAt, 0, componentId);
  // re-sort by order so devtools shows canonical order
  state.containerChildrenMapping[newParentId] = without.sort((a, b) => {
    const oA = page.components[a]?.layouts?.[currentLayout]?.order ?? 0;
    const oB = page.components[b]?.layouts?.[currentLayout]?.order ?? 0;
    return oA - oB;
  });
} else {
  // Existing absolute-grid behavior — also strip flex-only fields if present (drag-out)
  const next = { ...component.layouts[currentLayout], ...layout };
  delete next.order; delete next.mainHeight; delete next.mainWidth;
  delete next.fillMain; delete next.crossAlignSelf;
  component.layouts[currentLayout] = next;
}
```

### B3 — `componentsSlice.reorderFlexContainerChild`

```js
reorderFlexContainerChild: (flexContainerId, componentId, newIndex) => {
  set(withUndoRedo((state) => {
    const page = /* current page */;
    const mapping = state.containerChildrenMapping[flexContainerId];
    if (!mapping) return;

    const oldIndex = mapping.indexOf(componentId);
    if (oldIndex === -1 || oldIndex === newIndex) return;

    const reordered = [...mapping];
    reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, componentId);

    // Re-assign sparse orders (1000, 2000, ...) so future inserts have headroom
    reordered.forEach((id, idx) => {
      const layout = page.components[id]?.layouts?.[currentLayout];
      if (layout) layout.order = (idx + 1) * 1000;
    });

    state.containerChildrenMapping[flexContainerId] = reordered;
  }));
}
```

### Acceptance — Phase B checkpoint
- [ ] Zustand devtools: `flexContainerDropTarget` exists in store as `null`
- [ ] `reorderFlexContainerChild` action exists and produces a single history entry per call
- [ ] Manually call `setComponentLayout({...},flexContainerId,...)` via devtools → child layout has `order` only, no `top/left/width/height`
- [ ] Switching direction `column ↔ row` then re-inserting a child correctly drops stale `mainHeight`/`mainWidth`

---

## Phase C — First-drop path (react-dnd)

**Goal:** Dragging a widget from the right-side widget manager into a Flex Container appends it as the last child with a sparse `order`. Drop indicator updates within one rAF.

### C1 — Pure helpers
**File:** `frontend/src/AppBuilder/Widgets/FlexContainer/flexContainer.utils.js` *(new)*

```js
// direction-aware insertion index
export const computeInsertionIndex = (rects, mousePos, direction) => {
  if (!rects.length) return 0;
  const axisStart = direction === 'row' ? 'left' : 'top';
  const axisSize  = direction === 'row' ? 'width' : 'height';
  const axisCoord = direction === 'row' ? 'x' : 'y';
  for (let i = 0; i < rects.length; i++) {
    const mid = rects[i][axisStart] + rects[i][axisSize] / 2;
    if (mousePos[axisCoord] < mid) return i;
  }
  return rects.length;
};

// Synthesize absolute grid layout from drop coordinates (drag-out)
export const synthesizeGridLayoutFromDrop = (clientX, clientY, canvasRect, gridWidth, defaults = {}) => ({
  top:    Math.max(0, Math.round((clientY - canvasRect.top) / GRID_HEIGHT) * GRID_HEIGHT),
  left:   Math.max(0, Math.round((clientX - canvasRect.left) / gridWidth)),
  width:  defaults.width  ?? 10,
  height: defaults.height ?? 100,
});

// Strip flex-only fields when reparenting back to grid
export const stripFlexContainerLayoutFields = (layout) => {
  const { order, mainHeight, mainWidth, fillMain, crossAlignSelf, ...rest } = layout;
  return rest;
};

// DOM helper: read flex children rects from live DOM (cached during a single hover session)
export const getFlexChildRects = (flexContainerId) => {
  const container = document.querySelector(`[data-parentId="${flexContainerId}"]`);
  if (!container) return [];
  return [...container.querySelectorAll(':scope > .flex-child-wrapper')]
    .map(el => el.getBoundingClientRect());
};
```

### C2 — `Container.jsx` FlexContainer branch
**File:** `frontend/src/AppBuilder/AppCanvas/Container.jsx`

At the top of the component, branch out of the grid-cell math:

```jsx
if (componentType === 'FlexContainer') {
  return <FlexContainerHost id={id} {...props} />;
}
```

`FlexContainerHost` wraps `<FlexContainer>` (the runtime shell) and registers `useDrop` for the **first-drop-from-panel** case only:

```jsx
const dropRef = useRef(null);
const rectsRef = useRef(null); // cache during a hover session
const direction = useStore(s => /* parent-properties direction */);

const [, drop] = useDrop({
  accept: ItemTypes.BOX, // existing widget-manager drag type
  hover: rafThrottle((item, monitor) => {
    if (!monitor.isOver({ shallow: true })) return;
    const offset = monitor.getClientOffset();
    if (!offset) return;
    if (!rectsRef.current) rectsRef.current = getFlexChildRects(id);
    const idx = computeInsertionIndex(
      rectsRef.current,
      { x: offset.x, y: offset.y },
      direction
    );
    setFlexContainerDropTarget({ flexContainerId: id, index: idx });
  }),
  drop: (item, monitor) => {
    if (monitor.didDrop()) return;
    rectsRef.current = null;
    const offset = monitor.getClientOffset();
    const insertIndex = computeInsertionIndex(
      getFlexChildRects(id),
      { x: offset.x, y: offset.y },
      direction
    );
    const childIds = getContainerChildrenMapping(id);
    const orders = childIds.map(c => getComponentLayout(c)?.order ?? 0);
    const maxOrder = orders.length ? Math.max(...orders) : 0;
    setComponentLayout(
      { [item.id]: { order: maxOrder + 1000, insertIndex } },
      id, 'canvas', { updateParent: true }
    );
    setFlexContainerDropTarget(null);
  },
});

useEffect(() => () => setFlexContainerDropTarget(null), []); // unmount cleanup
```

Bare-canvas first hover (mouse in container but outside any child) does not engage the snap line until the cursor enters child bounds. Implement by short-circuiting the `setFlexContainerDropTarget` write when `rects.length === 0` — a first drop into an empty Flex Container always inserts at `0` without an indicator, and the empty placeholder fills that role.

### C3 — Drop indicator
**File:** `frontend/src/AppBuilder/Widgets/FlexContainer/FlexContainerDropIndicator.jsx` *(new)*

```jsx
export const FlexContainerDropIndicator = ({ flexContainerId, direction }) => {
  const target = useStore(s => s.flexContainerDropTarget, shallow);
  if (!target || target.flexContainerId !== flexContainerId) return null;

  const isRow = direction === 'row';
  const offsetPx = useMemo(() => computeIndicatorOffset(flexContainerId, target.index, direction), [flexContainerId, target.index, direction]);

  return (
    <div
      className="flex-container-drop-indicator"
      style={{
        position: 'absolute',
        pointerEvents: 'none',
        zIndex: 1000,
        background: '#4d72fa',
        ...(isRow
          ? { top: 0, bottom: 0, width: 2, left: offsetPx }
          : { left: 0, right: 0, height: 2, top: offsetPx }),
      }}
    >
      {/* circular caps */}
      <span className="cap cap-start" />
      <span className="cap cap-end" />
    </div>
  );
};
```

### Acceptance — Phase C checkpoint
- [ ] Drag widget from panel over empty Flex Container → empty placeholder visible; no indicator (rects empty)
- [ ] Drop on empty FC → child appears with `layouts[currentLayout] = { order: 1000 }` only (no top/left/width/height)
- [ ] Drag a second widget over the populated FC → 2px drop-line snaps to slot midpoints; updates ≤ one rAF
- [ ] Drop → child appended at correct insertion index; `containerChildrenMapping[id]` reflects the new order

---

## Phase D — Child rendering

**Goal:** Children inside a Flex Container render as flex items with correct cross-axis stretch and main-axis sizing. Direction-keyed `mainHeight`/`mainWidth` honoured.

### D1 — `FlexContainerChildWrapper.jsx`
**File:** `frontend/src/AppBuilder/Widgets/FlexContainer/FlexContainerChildWrapper.jsx` *(new)*

Replaces `WidgetWrapper` for this case. Carries `target widget-target moveable-box` classes that react-moveable selects. Owns `ConfigHandle`. No `useSortable`. No drag handle.

```jsx
export const FlexContainerChildWrapper = ({ componentId, flexContainerId, direction }) => {
  const layout = useStore(s => getLayoutFor(s, componentId), shallow);
  const { mainHeight, mainWidth, fillMain, crossAlignSelf } = layout;

  const isRow = direction === 'row';
  const flexBasisPx = isRow ? mainWidth : mainHeight;
  const flexValue = fillMain
    ? '1 1 0'
    : (flexBasisPx != null ? `0 0 ${flexBasisPx}px` : '0 0 auto');

  return (
    <div
      id={componentId}
      data-component-id={componentId}
      className="target widget-target moveable-box flex-child-wrapper"
      style={{
        flex: flexValue,
        ...(isRow ? { height: '100%' } : { width: '100%' }),
        alignSelf: crossAlignSelf || undefined,
        position: 'relative',
      }}
    >
      <WidgetComponent componentId={componentId} />
      <ConfigHandle componentId={componentId} />
    </div>
  );
};
```

### D2 — Wire children in `FlexContainer.jsx`
Replace placeholder map with `FlexContainerChildWrapper` per `childId`. Render `FlexContainerDropIndicator` as a sibling inside the inner flex container (positioned absolutely).

### D3 — Insert index helper for moveable
**File:** `frontend/src/AppBuilder/AppCanvas/Grid/gridUtils.js`

Export thin wrapper used by `Grid.jsx onDrag` and `flexContainerDragEnd.js`:

```js
export const getFlexContainerInsertIndex = (flexContainerId, clientX, clientY, direction) => {
  const rects = getFlexChildRects(flexContainerId);
  return computeInsertionIndex(rects, { x: clientX, y: clientY }, direction);
};
```

### Acceptance — Phase D checkpoint
- [ ] Children dropped in Phase C now visibly stretch to full cross-axis (column → width 100%, row → height 100%)
- [ ] Setting `mainHeight`/`mainWidth` directly via devtools reflows the child's main-axis size
- [ ] Toggling `fillMain = true` makes the child grow to fill remaining space (`flex: 1 1 0`)
- [ ] `ConfigHandle` shows correctly relative to the flex item bounds (not grid)
- [ ] Inspector opens for flex children when selected

---

## Phase E — react-moveable adjustments

**Goal:** Drag-out, reparent, and resize work correctly for Flex Container children. Per-axis resize handle. Drag pipeline routes through a single helper.

### E1 — `Grid.jsx` per-target `renderDirections`
**File:** `frontend/src/AppBuilder/AppCanvas/Grid/Grid.jsx`

```js
const isFlexChild = (target) => {
  const compId = target?.id;
  const comp = getComponentById(compId);
  const parent = getComponentById(comp?.component?.parent);
  return parent?.component?.component === 'FlexContainer';
};

const flexParentDirection = (target) => {
  const parentId = getComponentById(target?.id)?.component?.parent;
  return getComponentById(parentId)?.component?.definition?.properties?.direction?.value ?? 'column';
};

renderDirections={(target) => {
  if (!isFlexChild(target)) return ['n','nw','ne','s','sw','se','e','w'];
  return flexParentDirection(target) === 'row' ? ['e'] : ['s'];
}}
```

### E2 — `Grid.jsx onDrag` for flex children: skip grid snap, free transform
For flex children, do not write `top/left` to the store during `onDrag`. Apply only the transform on the moveable element so the ghost follows the cursor; main-axis sizing stays whatever the flexbox layout provided.

### E3 — `Grid.jsx onResizeEnd` direction-keyed write
```js
if (isFlexChild(e.target)) {
  const dir = flexParentDirection(e.target);
  const sizeKey = dir === 'row' ? 'mainWidth' : 'mainHeight';
  const px = dir === 'row' ? Math.round(e.lastEvent?.width) : Math.round(e.lastEvent?.height);
  setComponentLayout({ [e.target.id]: { [sizeKey]: px } });
  return;
}
```
Never writes `top/left/width/height` for a flex child.

### E4 — `flexContainerDragEnd.js`
**File:** `frontend/src/AppBuilder/AppCanvas/Grid/helpers/flexContainerDragEnd.js` *(new)*

Three cases (Phase F populates the same-FC reorder branch):

```js
export const handleFlexContainerDragEnd = ({
  componentId, sourceParentId, targetParentId, dropClientX, dropClientY, canvasRect, gridWidth,
}) => {
  const srcType = getParentComponentType(sourceParentId);
  const tgtType = getParentComponentType(targetParentId);
  const srcIsFlex = srcType === 'FlexContainer';
  const tgtIsFlex = tgtType === 'FlexContainer';

  // Case 1: same FlexContainer → reorder (Phase F wires this)
  if (srcIsFlex && tgtIsFlex && sourceParentId === targetParentId) {
    const dir = getFlexDirection(targetParentId);
    const newIndex = getFlexContainerInsertIndex(targetParentId, dropClientX, dropClientY, dir);
    reorderFlexContainerChild(targetParentId, componentId, newIndex);
    setFlexContainerDropTarget(null);
    return;
  }

  // Case 2: different FlexContainer → reparent INTO target with computed order
  if (tgtIsFlex) {
    const dir = getFlexDirection(targetParentId);
    const insertIndex = getFlexContainerInsertIndex(targetParentId, dropClientX, dropClientY, dir);
    const childIds = getContainerChildrenMapping(targetParentId);
    const orders = childIds.map(c => getComponentLayout(c)?.order ?? 0);
    const maxOrder = orders.length ? Math.max(...orders) : 0;
    setComponentLayout(
      { [componentId]: { order: maxOrder + 1000, insertIndex } },
      targetParentId, 'canvas', { updateParent: true }
    );
    setFlexContainerDropTarget(null);
    return;
  }

  // Case 3: drag OUT of FlexContainer → strip flex fields, synthesize grid layout
  if (srcIsFlex && !tgtIsFlex) {
    const synthesized = synthesizeGridLayoutFromDrop(dropClientX, dropClientY, canvasRect, gridWidth);
    const cleaned = stripFlexContainerLayoutFields({ ...getComponentLayout(componentId), ...synthesized });
    setComponentLayout({ [componentId]: cleaned }, targetParentId, 'canvas', { updateParent: true });
    setFlexContainerDropTarget(null);
    return;
  }
};
```

### E5 — `Grid.jsx onDragEnd` routing
```js
onDragEnd={(e) => {
  if (sourceIsFlexContainer || targetIsFlexContainer) {
    handleFlexContainerDragEnd({ ... });
    return;
  }
  // existing handleDragEnd()
}}
```

### Acceptance — Phase E checkpoint
- [ ] Selecting a FC child shows only **south** handle (column) or **east** handle (row); never all 8
- [ ] Resize via south handle → only `mainHeight` written in px; siblings shift down; no `top/left/width/height` writes
- [ ] Resize via east handle → only `mainWidth` written in px; siblings shift right
- [ ] Drag a FC child OUT to canvas → lands at drop coords; layout has `top/left/width/height`; `order/mainHeight/mainWidth/fillMain/crossAlignSelf` all stripped
- [ ] Drag from FC `A` into FC `B` (different) → child appears in `B` at insertion index from drop coords; `order` set; layout direction-keyed

---

## Phase F — Intra-FlexContainer reorder via react-moveable

**Goal:** Dragging a child within its current Flex Container reorders it. The drop indicator follows the cursor during the drag. Single store mutation on drop.

### F1 — `Grid.jsx onDrag` insertion-slot computation (FC child only)
Inside the existing `onDrag` handler, when `isFlexChild(target)` and the cursor is still within the source FC bounds:

```js
const dir = flexParentDirection(target);
const idx = getFlexContainerInsertIndex(parentId, e.clientX, e.clientY, dir);
rafThrottled(() => setFlexContainerDropTarget({ flexContainerId: parentId, index: idx }));
```

When the cursor leaves the FC bounds (mouse over a different parent), clear: `setFlexContainerDropTarget(null)`. Phase E's onDragEnd routing handles the resulting reparent.

### F2 — Wire `flexContainerDragEnd.js` Case 1 (already drafted in E4)
Confirm the same-FC branch dispatches `reorderFlexContainerChild` exactly once per drop. Verify single history entry.

### F3 — Drop indicator integration
`FlexContainerDropIndicator` already subscribes to `flexContainerDropTarget` (Phase C3) — Phase F just feeds it from the moveable `onDrag` path instead of (or in addition to) react-dnd `useDrop.hover`. Both write the same shape. The only risk is a stale value on fast drags — `useEffect` cleanup in `Container.jsx` already nulls it on unmount; ensure `onDragEnd` always nulls.

### Acceptance — Phase F checkpoint
- [ ] Drag child #2 above child #1 within the same FC → 2px drop indicator follows cursor, snaps to midpoints
- [ ] Release → `reorderFlexContainerChild` fires once; verify single Zustand history entry
- [ ] Children re-render in the new order; `containerChildrenMapping` reflects new sequence; no `top/left` written
- [ ] During the drag, the moveable resize handles do not appear / interfere

---

## Phase G — Inspector polish + edge cases

**Goal:** Final acceptance pass per SPEC §10 + §15.8. Inspector schema already complete from A2; this phase verifies and fixes any shortfalls.

### G1 — Per-child schema additions
**File:** `frontend/src/AppBuilder/RightSideBar/Inspector/Components/FlexChildLayoutPanel.jsx` *(already untracked in git status; verify wiring)*
- `fillMain` toggle
- `crossAlignSelf` select (`flex-start | center | flex-end | stretch`)
- Inspector should hide `top/left/width/height` fields for FC children
- Inspector should show only `mainHeight` (column) or `mainWidth` (row) for the main-axis size — direction-aware

### G2 — Mobile layout keying
Verify that `setComponentLayout` already writes into `layouts[currentLayout]`, so `mainHeight`/`mainWidth`/`order`/`fillMain`/`crossAlignSelf` are layout-keyed automatically. Switch layout in devtools and confirm.

### G3 — Overflow + flexWrap behaviour
- `flexWrap=false`, column → `overflow-y: auto` activates when content exceeds inner height
- `flexWrap=false`, row → `overflow-x: auto` activates when content exceeds inner width
- `flexWrap=true` → no overflow scroll; children wrap to next row/column
- When `flexWrap=true`, MVP behaviour: drop into a wrapped FC always appends (`index = last`); insertion line disabled (documented v2 follow-up per SPEC §15.9)

### G4 — Nested FlexContainer
- Outer FC with column direction; inner FC with row direction; verify outer treats inner as a single flex child with `mainHeight`
- `findNewParentIdFromMousePosition` deepest-wins by z-order — drop indicator scopes to the deepest hovered FC

### G5 — Widget-class isolation
- Existing Container / Form / Tabs / Modal: drag/drop and absolute positioning unchanged
- Existing apps load with no errors and no layout drift (schema additive)

### Final acceptance walkthrough — SPEC §10 + §15.8
Run `cd frontend && npm start`, then:

**Column path (§10):**
1. Add Flex Container → grid widget; outer rect resizes in all 4 directions
2. Drop a Button into empty FC → placeholder visible, drop succeeds, button is full-width
3. Drop a second Button → appends as new last child
4. Reorder child #2 above child #1 → drop-line indicator; correct `order` after drop; single store mutation
5. Resize child → south handle only; `mainHeight` in px; siblings shift; no `top/left/width` written
6. Drag a child OUT → reverts to absolute positioning with sensible `top/left/width/height`
7. Nested FC → drop indicator scopes to the deepest hovered FC; inner reflows
8. Inspector `gap`/`padding`/`justify`/`align` → live updates; persists after reload
9. Overflow → inner scrolls (`overflow-y: auto`) without breaking outer bounds
10. Mobile layout switch → flex still active; layout-keyed `mainHeight`/`order` apply
11. No regressions → existing Container/Form/Tabs/Modal drag/drop unchanged

**Row path (§15.8):**
12. Switch direction to `row` → children stack left-to-right
13. Drop widgets → fill full height (cross-axis 100%); `gap`/`padding` apply on X axis
14. Reorder in row → 2px **vertical** drop-line snaps on X axis
15. East-handle resize → only `e` handle; `mainWidth` in px; siblings shift right
16. `fillMain` on a child → expands to fill remaining horizontal space
17. `flexWrap=false` + row → `overflow-x: auto` activates
18. `flexWrap=true` + row → wrap active; no overflow scroll
19. Drag child out of row FC → absolute layout synthesized; both `mainWidth` and `mainHeight` stripped
20. Nested directions (column inside row) → outer treats inner as single flex child with `mainWidth`
21. Switch direction `column → row → column` on a populated FC → stale `mainHeight`/`mainWidth` correctly absent

---

## Acceptance gates (must hold for merge — SPEC §10)

- [ ] **Latency:** drop indicator updates ≤ one `requestAnimationFrame` (≤16ms) of cursor move
- [ ] **Reorder = single store mutation:** `reorderFlexContainerChild` produces one history entry; verify in devtools
- [ ] **No regression:** existing Container / Form / Tabs / Modal drag/drop and absolute positioning unchanged
- [ ] **Schema additive:** open an existing app saved before this change → loads with no errors and no layout drift

---

## Risk mitigations (inline)

| Risk | Mitigation |
|---|---|
| react-moveable per-target `renderDirections` rarely used in this codebase | Validate handle visuals before+after, including multi-select deselect/re-select |
| `mainHeight` / `mainWidth` co-existence after direction switch | `setComponentLayout` flex branch deletes the stale main-axis key when writing the other; verify in B-CHECK and in G acceptance step 21 |
| Moveable reorder vs react-dnd first-drop overlap | Both paths write the same `flexContainerDropTarget` shape; rAF throttle on both; `onDragEnd` always nulls the indicator |
| `findNewParentIdFromMousePosition` mis-classifies nested FC | Existing deepest-wins behaviour handles this; verify in G4 |
| Free transform in `onDrag` for FC child leaves the element offset visually after drop | On drop, clear inline `transform`; flexbox reflow takes over |
| `flexWrap=true` breaks insertion index | MVP: indicator disabled when `flexWrap=true`; drop always appends; documented v2 follow-up |
| `WidgetWrapper.jsx` accidentally edited (out-of-scope per SPEC §11 "Ask first") | None of the listed phases edit `WidgetWrapper.jsx`; if needed, escalate before touching |

---

## Out of scope for this iteration (per SPEC §2 + §14)

- Dynamic-height auto-grow for the Flex Container outer height
- Undo/redo coverage for `reorderFlexContainerChild` and into/out-of-FC reparents
- Multi-select drag mixing FC children + grid children (filter at drag-start; documented v2)
- Insertion line during `flexWrap=true` reorder (MVP: append-only)
- Automated tests (manual verification only)
