import { GRID_HEIGHT } from '@/AppBuilder/AppCanvas/appCanvasConstants';

const FLEX_LAYOUT_FIELDS = ['flexOrder', 'mainSize', 'fillMain', 'crossAlignSelf'];
const GRID_LAYOUT_FIELDS = ['top', 'left', 'width', 'height'];

/**
 * Returns the insertion slot index for a given mouse position.
 * direction: 'column' (default) uses Y axis; 'row' uses X axis.
 */
export const computeInsertionIndex = (rects, mousePos, direction = 'column') => {
  if (!rects || rects.length === 0) return 0;
  const isRow = direction === 'row';
  const coord = typeof mousePos === 'number' ? mousePos : isRow ? mousePos.x : mousePos.y;
  for (let i = 0; i < rects.length; i++) {
    const mid = isRow ? rects[i].left + rects[i].width / 2 : rects[i].top + rects[i].height / 2;
    if (coord < mid) return i;
  }
  return rects.length;
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
