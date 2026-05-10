import { GRID_HEIGHT } from '@/AppBuilder/AppCanvas/appCanvasConstants';

const FLEX_LAYOUT_FIELDS = [
  'flexOrder',
  'fillWidth',
  'fillHeight',
  'widthPx',
  'heightPx',
  'crossAlignSelf',
  // Legacy single-axis fields stripped during migration / reparenting.
  'mainSize',
  'fillMain',
];
const GRID_LAYOUT_FIELDS = ['top', 'left', 'width', 'height'];

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
 * Pure flex reorder: computes new flexOrder patches and ordered child ids from a
 * page.components snapshot. `newIndex` is the insertion index after removing `componentId`
 * from `mapping` (same convention as computeFlexInsertIndex).
 */
export const computeFlexContainerReorder = ({ components, mapping, currentLayout, componentId, newIndex }) => {
  if (!mapping?.length || !components) {
    return null;
  }

  const oldIndex = mapping.indexOf(componentId);
  if (oldIndex === -1) {
    return null;
  }

  const reorderedChildIds = [...mapping];
  reorderedChildIds.splice(oldIndex, 1);
  reorderedChildIds.splice(newIndex, 0, componentId);

  const beforeId = reorderedChildIds[newIndex - 1];
  const afterId = reorderedChildIds[newIndex + 1];
  const beforeOrder = beforeId ? components[beforeId]?.layouts?.[currentLayout]?.flexOrder ?? 0 : 0;
  const afterOrder = afterId ? components[afterId]?.layouts?.[currentLayout]?.flexOrder ?? null : null;

  const newFlexOrder = afterOrder === null ? beforeOrder + 1000 : (beforeOrder + afterOrder) / 2;

  const gapTooSmall = afterOrder !== null && (newFlexOrder - beforeOrder < 1 || afterOrder - newFlexOrder < 1);

  const layoutPatch = {};
  if (gapTooSmall) {
    reorderedChildIds.forEach((id, idx) => {
      if (components[id]?.layouts?.[currentLayout]) {
        layoutPatch[id] = { flexOrder: (idx + 1) * 1000 };
      }
    });
  } else if (components[componentId]?.layouts?.[currentLayout]) {
    layoutPatch[componentId] = { flexOrder: newFlexOrder };
  }

  if (Object.keys(layoutPatch).length === 0) {
    return null;
  }

  return { layoutPatch, reorderedChildIds };
};

/**
 * Canonical insertion-index helper used by first-drop hover (Container.jsx),
 * moveable onDrag indicator (Grid.jsx), and drag-end finalization (flexContainerDragEnd.js).
 *
 * Optionally excludes one child element by id — pass the dragged widget's id during
 * moveable drag so its own rect does not skew the midpoint calculation. The returned
 * index is correct to pass to computeFlexContainerReorder (slot in the shortened array).
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
