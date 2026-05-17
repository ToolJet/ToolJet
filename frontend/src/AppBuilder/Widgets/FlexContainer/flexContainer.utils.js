import { GRID_HEIGHT } from '@/AppBuilder/AppCanvas/appCanvasConstants';

/** Width breakpoints aligned with widget config labels (Mobile 375px, Tablet 768px). */
export const STACK_THRESHOLD_PX = {
  mobile: 375,
  tablet: 768,
};

/**
 * Returns the main app canvas width in CSS pixels, or +Infinity if unavailable (SSR / no DOM).
 */
export const getMainCanvasWidthPx = () => {
  if (typeof document === 'undefined') return Number.POSITIVE_INFINITY;
  const el = document.getElementById('real-canvas');
  const w = el?.getBoundingClientRect()?.width;
  return Number.isFinite(w) ? w : Number.POSITIVE_INFINITY;
};

/**
 * Stacking when `#real-canvas` width is at or below the threshold for `stackBelow`.
 * Nested FlexContainers still use the global main canvas width (PRD).
 */
export const computeShouldStackFlex = (stackBelow) => {
  if (!stackBelow || stackBelow === 'none') return false;
  const threshold = STACK_THRESHOLD_PX[stackBelow];
  if (threshold === undefined) return false;
  return getMainCanvasWidthPx() <= threshold;
};

export const computeEffectiveFlexDirection = (resolvedDirection = 'column', stackBelow) =>
  computeShouldStackFlex(stackBelow) ? 'column' : resolvedDirection;

/**
 * Drag handlers (non-React): effective flex direction for a FlexContainer parent from the store snapshot.
 */
export const getEffectiveFlexDirectionForFlexContainer = (getResolvedComponent, parentId, moduleId, indices = null) => {
  const props = getResolvedComponent?.(parentId, indices, moduleId)?.properties ?? {};
  const direction = props.direction ?? 'column';
  const stackBelow = props.stackBelow ?? 'none';
  return computeEffectiveFlexDirection(direction, stackBelow);
};

const FLEX_LAYOUT_FIELDS = [
  'flexOrder',
  'fillWidth',
  'fillHeight',
  'widthPx',
  'heightPx',
  'crossAlignSelf',
  'stackedWidthBehavior',
  // Legacy single-axis fields stripped during migration / reparenting.
  'mainSize',
  'fillMain',
];
const GRID_LAYOUT_FIELDS = ['top', 'left', 'width', 'height'];

const clampIndex = (index, length) => {
  const numericIndex = Number.isFinite(index) ? index : length;
  return Math.max(0, Math.min(numericIndex, length));
};

export const normalizeChildOrder = (childOrder = [], actualChildIds = []) => {
  const actualIds = Array.isArray(actualChildIds) ? actualChildIds : [];
  const actualIdSet = new Set(actualIds);
  const seen = new Set();
  const normalized = [];

  if (Array.isArray(childOrder)) {
    childOrder.forEach((id) => {
      if (actualIdSet.has(id) && !seen.has(id)) {
        seen.add(id);
        normalized.push(id);
      }
    });
  }

  actualIds.forEach((id) => {
    if (!seen.has(id)) {
      seen.add(id);
      normalized.push(id);
    }
  });

  return normalized;
};

export const removeId = (order = [], id) => {
  if (!Array.isArray(order)) return [];
  return order.filter((childId) => childId !== id);
};

export const insertId = (order = [], id, index) => {
  const withoutId = removeId(order, id);
  const nextOrder = [...withoutId];
  nextOrder.splice(clampIndex(index, withoutId.length), 0, id);
  return nextOrder;
};

export const moveId = (order = [], id, index) => insertId(order, id, index);

export const getFlexContainerChildOrder = (components, flexContainerId) => {
  const value = components?.[flexContainerId]?.component?.definition?.properties?.childOrder?.value;
  return Array.isArray(value) ? value : [];
};

export const getOrderedFlexChildrenFromSnapshot = (components, flexContainerId, mapping = null) => {
  const actualChildIds = Array.isArray(mapping)
    ? mapping.filter((id) => components?.[id]?.component?.parent === flexContainerId)
    : Object.keys(components ?? {}).filter((id) => components?.[id]?.component?.parent === flexContainerId);

  return normalizeChildOrder(getFlexContainerChildOrder(components, flexContainerId), actualChildIds);
};

export const getOrderedFlexChildren = (flexContainerId, moduleId, storeState) => {
  const components = storeState?.getCurrentPageComponents?.(moduleId) ?? {};
  const mapping = storeState?.containerChildrenMapping?.[flexContainerId] ?? [];
  return getOrderedFlexChildrenFromSnapshot(components, flexContainerId, mapping);
};

/**
 * Resolves per-axis sizing for a FlexContainer child from its layout object.
 *
 * Returns `{ fillWidth, fillHeight, widthPx, heightPx }`, falling back to legacy
 * `fillMain` / `mainSize` when the new fields are absent so apps saved before the
 * two-axis migration continue to render unchanged.
 *
 * Defaults preserve historical visuals: cross axis fills, main axis is fixed.
 */
export const resolveFlexChildSizing = (layoutData = {}, direction = 'column', fallbacks = {}) => {
  const isRow = direction === 'row';
  const legacyFill = layoutData.fillMain;
  const legacyMainPx = layoutData.mainSize;

  const fallbackWidthPx = fallbacks.widthPx ?? null;
  const fallbackHeightPx = fallbacks.heightPx ?? null;

  const fillWidth = layoutData.fillWidth !== undefined ? layoutData.fillWidth : isRow ? legacyFill ?? false : true;
  const fillHeight = layoutData.fillHeight !== undefined ? layoutData.fillHeight : isRow ? true : legacyFill ?? false;

  const widthPx = layoutData.widthPx ?? (isRow ? legacyMainPx ?? fallbackWidthPx : fallbackWidthPx) ?? null;
  const heightPx = layoutData.heightPx ?? (isRow ? fallbackHeightPx : legacyMainPx ?? fallbackHeightPx) ?? null;

  return { fillWidth, fillHeight, widthPx, heightPx };
};

/**
 * Returns the insertion slot index for a given mouse position.
 * direction: 'column' (default) uses Y as main axis; 'row' uses X as main axis.
 *
 * Wrap-aware: groups children into buckets by cross-axis position (row for row-direction,
 * column for column-direction), picks the bucket containing the cursor's cross coord
 * (or nearest if between buckets), then resolves the main-axis insertion index inside it.
 */
export const computeInsertionIndex = (rects, mousePos, direction = 'column') => {
  if (!rects || rects.length === 0) return 0;
  const isRow = direction === 'row';
  const mainStart = isRow ? 'left' : 'top';
  const mainSize = isRow ? 'width' : 'height';
  const crossStart = isRow ? 'top' : 'left';
  const crossEnd = isRow ? 'bottom' : 'right';
  const mouseMain = isRow ? mousePos.x : mousePos.y;
  const mouseCross = isRow ? mousePos.y : mousePos.x;
  const tolerance = 2;

  // Group children that share approximately the same cross-axis start into buckets.
  const buckets = [];
  rects.forEach((rect, index) => {
    const bucket = buckets.find((b) => Math.abs(b.start - rect[crossStart]) < tolerance);
    if (bucket) {
      bucket.end = Math.max(bucket.end, rect[crossEnd]);
      bucket.items.push({ rect, index });
    } else {
      buckets.push({ start: rect[crossStart], end: rect[crossEnd], items: [{ rect, index }] });
    }
  });

  // Cursor inside a bucket's cross-axis range, else nearest bucket by cross-axis distance.
  let target = buckets.find((b) => mouseCross >= b.start && mouseCross <= b.end);
  if (!target) {
    let bestDist = Infinity;
    buckets.forEach((b) => {
      const dist = mouseCross < b.start ? b.start - mouseCross : mouseCross - b.end;
      if (dist < bestDist) {
        bestDist = dist;
        target = b;
      }
    });
  }

  // Inside the chosen bucket, find first child whose main-axis midpoint is past the cursor.
  for (let i = 0; i < target.items.length; i++) {
    const r = target.items[i].rect;
    const mid = r[mainStart] + r[mainSize] / 2;
    if (mouseMain < mid) return target.items[i].index;
  }
  // Cursor past every child in this bucket — insert after the bucket's last item.
  return target.items[target.items.length - 1].index + 1;
};

/**
 * Synthesizes an absolute grid layout from drop coordinates.
 * Used when dragging a FlexContainer child OUT to the canvas.
 */
export const synthesizeGridLayoutFromDrop = (
  clientX,
  clientY,
  canvasRect,
  gridWidth,
  defaultWidth = 10,
  defaultHeight = 100
) => {
  const rawLeft = clientX - canvasRect.left;
  const rawTop = clientY - canvasRect.top;
  const left = Math.max(0, Math.round(rawLeft / gridWidth));
  const top = Math.max(0, Math.round(rawTop / GRID_HEIGHT) * GRID_HEIGHT);
  return { top, left, width: defaultWidth, height: defaultHeight };
};

/**
 * Strips FlexContainer-only layout fields.
 * Used when reparenting a flex child to the grid.
 */
export const stripFlexContainerLayoutFields = (layout) => {
  if (!layout) return {};
  const result = { ...layout };
  FLEX_LAYOUT_FIELDS.forEach((f) => delete result[f]);
  return result;
};

/**
 * Strips grid layout fields.
 * Used when reparenting a grid child into a FlexContainer.
 */
export const stripGridLayoutFields = (layout) => {
  if (!layout) return {};
  const result = { ...layout };
  GRID_LAYOUT_FIELDS.forEach((f) => delete result[f]);
  return result;
};

/**
 * Returns the child rects (as DOMRect[]) for the direct flex children
 * of a FlexContainer, in DOM order.
 */
export const getFlexChildRects = (flexContainerId) => {
  const inner = document.querySelector(`[data-parentId="${flexContainerId}"]`);
  if (!inner) return [];
  const children = inner.querySelectorAll(':scope > .flex-child-wrapper');
  return Array.from(children).map((el) => el.getBoundingClientRect());
};

/**
 * Canonical insertion-index helper used by first-drop hover (Container.jsx),
 * moveable onDrag indicator (Grid.jsx), and drag-end finalization (flexContainerDragEnd.js).
 *
 * Optionally excludes one child element by id — pass the dragged widget's id during
 * moveable drag so its own rect does not skew the midpoint calculation. The returned
 * index is the slot in the shortened array after excluding the dragged widget.
 */
export const computeFlexInsertIndex = (flexContainerId, clientX, clientY, direction = 'column', excludeId = null) => {
  const inner = document.querySelector(`[data-parentId="${flexContainerId}"]`);
  if (!inner) return 0;
  const children = Array.from(inner.querySelectorAll(':scope > .flex-child-wrapper')).filter(
    (el) => !excludeId || el.id !== excludeId
  );
  if (!children.length) return 0;
  const rects = children.map((el) => el.getBoundingClientRect());
  return computeInsertionIndex(rects, { x: clientX, y: clientY }, direction);
};
