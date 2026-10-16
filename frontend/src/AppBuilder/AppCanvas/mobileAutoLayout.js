/**
 * Mobile auto layout: stacks each canvas's components into one full-width column for the mobile layout
 * (react-grid-layout's vertical compaction, kept in-tree).
 */
import useStore from '@/AppBuilder/_stores/store';
import { NO_OF_GRIDS } from './appCanvasConstants';

export const MOBILE_GRID_COLUMNS = NO_OF_GRIDS;
// Vertical breathing room between stacked mobile items (top/height are in px).
const MOBILE_STACK_GAP_PX = 10;
// Side inset in grid columns; keeps the gutter on the components instead of the canvas padding.
const MOBILE_SIDE_INSET_COLUMNS = 1;

// Backstop for compactItem's move-down loop, which has no structural exit if a top goes NaN.
const MAX_COMPACTION_STEPS = 10000;

// Stack each parent's children into a full-width mobile column, bottom-up. Returns { [id]: box }.
export function computeAutoMobileLayout(currentPageComponents) {
  const ids = Object.keys(currentPageComponents);

  // Bucket ids by parent key: ROOT for top-level, `${id}` / `${id}-${slot}` for children.
  const ROOT = '__root__';
  const childrenByParent = {};
  ids.forEach((id) => {
    const parent = currentPageComponents[id]?.component?.parent ?? ROOT;
    (childrenByParent[parent] = childrenByParent[parent] || []).push(id);
  });

  const updatedBoxes = {};
  const visited = new Set(); // guard against cyclic parent refs (corrupt data)

  // Raw definition, not the resolved cache — the cache is empty in the viewer on first compute.
  const getResolvedValue = useStore.getState().getResolvedValue;
  const isVisibleOnMobile = (id) =>
    getResolvedValue(currentPageComponents[id]?.component?.definition?.others?.showOnMobile?.value);

  // Stack against the rendered height but store the unbumped one, or WidgetWrapper's re-applied
  // 20px label bump doubles and overlaps the next sibling.
  const calculateMoveableBoxHeightWithId = useStore.getState().calculateMoveableBoxHeightWithId;
  const labelBumpById = {};
  const renderedHeight = (id, desktop) => {
    const base = desktop.height ?? 0;
    const rendered =
      calculateMoveableBoxHeightWithId(id, 'desktop', currentPageComponents[id]?.component?.definition?.styles) ?? base;
    labelBumpById[id] = rendered - base;
    return rendered;
  };

  // Stack a parent's direct children into one full-width column (children recursed first).
  const stackGroup = (parentKey) => {
    // Inset the root column only — a nested container already sits inside the root's inset.
    const sideInset = parentKey === ROOT ? MOBILE_SIDE_INSET_COLUMNS : 0;
    const layouts = (childrenByParent[parentKey] || []).filter(isVisibleOnMobile).map((id) => {
      const desktop = currentPageComponents[id]?.layouts?.desktop || {};
      const nestedExtent = stackContainer(id);
      const height = renderedHeight(id, desktop);
      return {
        i: id,
        top: desktop.top ?? 0,
        left: sideInset,
        width: MOBILE_GRID_COLUMNS - sideInset * 2,
        height: nestedExtent != null ? Math.max(height, nestedExtent) : height,
      };
    });

    // Compacted as laid out: no width scaling or left reset, which would undo the side inset.
    const stacked = compact(layouts, 'vertical', MOBILE_GRID_COLUMNS);

    // compact() packs items flush; offset each by a cumulative 10px gap (top/height are in px).
    let extent = 0;
    [...stacked]
      .sort((a, b) => a.top - b.top)
      .forEach((l, idx) => {
        // Leading gap at the root replaces the removed canvas top padding.
        const top = l.top + (idx + (sideInset ? 1 : 0)) * MOBILE_STACK_GAP_PX;
        // Spacing uses the rendered height; the stored height drops the bump the renderer re-adds.
        updatedBoxes[l.i] = { left: l.left, top, width: l.width, height: l.height - (labelBumpById[l.i] ?? 0) };
        extent = Math.max(extent, top + l.height);
      });
    return extent;
  };

  // Stack a component's own groups (direct + slots); returns max extent, or null if a leaf.
  const stackContainer = (id) => {
    if (visited.has(id)) return null;
    visited.add(id);
    const groupKeys = Object.keys(childrenByParent).filter((k) => k === id || k.startsWith(`${id}-`));
    if (groupKeys.length === 0) return null;
    return groupKeys.reduce((max, key) => Math.max(max, stackGroup(key)), 0);
  };

  stackGroup(ROOT);

  // Fallback: anything not reached keeps its desktop layout.
  ids.forEach((id) => {
    if (!updatedBoxes[id]) updatedBoxes[id] = currentPageComponents[id]?.layouts?.desktop ?? {};
  });

  return updatedBoxes;
}

function collides(l1, l2) {
  if (l1.i === l2.i) return false; // same element
  if (l1.left + l1.width <= l2.left) return false; // l1 is left of l2
  if (l1.left >= l2.left + l2.width) return false; // l1 is right of l2
  if (l1.top + l1.height <= l2.top) return false; // l1 is above l2
  if (l1.top >= l2.top + l2.height) return false; // l1 is below l2
  return true; // boxes overlap
}

function getFirstCollision(layout, layoutItem) {
  for (let i = 0, len = layout.length; i < len; i++) {
    const isCollides = collides(layout[i], layoutItem);
    if (isCollides) return layout[i];
  }
  return null; // Return null if there's no collision
}

export function compact(layout, compactType = 'vertical', cols = 20, allowOverlap = false) {
  // Statics go in the compareWith array right away so items flow around them.
  const compareWith = getStatics(layout);
  // We go through the items by row and column.
  const sorted = sortLayoutItems(layout, compactType);
  // Holding for new items.
  const out = new Array(layout.length);

  for (let i = 0, len = sorted.length; i < len; i++) {
    let l = cloneLayoutItem(sorted[i]);

    // Don't move static elements
    if (!l.static) {
      l = compactItem(compareWith, l, compactType, cols, sorted, allowOverlap);

      // Add to comparison array. We only collide with items before this one.
      // Statics are already in this array.
      compareWith.push(l);
    }

    // Add to output array to make sure they still come out in the right order.
    out[layout.indexOf(sorted[i])] = l;

    // Clear moved flag, if it exists.
    l.moved = false;
  }

  return out;
}

export function getStatics(layout) {
  return layout.filter((l) => l.static);
}

// Fast path to cloning, since this is monomorphic
export function cloneLayoutItem(layoutItem) {
  return {
    width: layoutItem.width,
    height: layoutItem.height,
    left: layoutItem.left,
    top: layoutItem.top,
    i: layoutItem.i,
    minW: layoutItem.minW,
    maxW: layoutItem.maxW,
    minH: layoutItem.minH,
    maxH: layoutItem.maxH,
    moved: Boolean(layoutItem.moved),
    static: Boolean(layoutItem.static),
    // These can be null/undefined
    isDraggable: layoutItem.isDraggable,
    isResizable: layoutItem.isResizable,
    resizeHandles: layoutItem.resizeHandles,
    isBounded: layoutItem.isBounded,
  };
}

function compactItem(compareWith, l, compactType, cols, fullLayout, allowOverlap) {
  const compactV = compactType === 'vertical';
  const compactH = compactType === 'horizontal';
  if (compactV) {
    // Bottom 'top' possible is the bottom of the layout.
    // This allows you to do nice stuff like specify {top: Infinity}
    // This is here because the layout must be sorted in order to get the correct bottom `top`.
    const bottomPos = bottom(compareWith);
    l.top = Math.min(bottomPos, l.top);
    // Move the element up as far as it can go without colliding.
    while (l.top > 0 && !getFirstCollision(compareWith, l)) {
      l.top--;
    }
  } else if (compactH) {
    // Move the element left as far as it can go without colliding.
    while (l.left > 0 && !getFirstCollision(compareWith, l)) {
      l.left--;
    }
  }

  // Move it down, and keep moving it down if it's colliding.
  let collides;
  let steps = 0;
  // Checking the compactType null value to avoid breaking the layout when overlapping is allowed.
  while ((collides = getFirstCollision(compareWith, l)) && !(compactType === null && allowOverlap)) {
    if (++steps > MAX_COMPACTION_STEPS) {
      // eslint-disable-next-line no-console
      console.error('compactItem: compaction did not converge, bailing out', { item: l.i, top: l.top });
      break;
    }
    if (compactH) {
      resolveCompactionCollision(fullLayout, l, collides.left + collides.width, 'x');
    } else {
      resolveCompactionCollision(fullLayout, l, collides.top + collides.height, 'top');
    }
    // Since we can't grow without bounds horizontally, if we've overflown, let's move it down and try again.
    if (compactH && l.left + l.width > cols) {
      l.left = cols - l.width;
      l.top++;
      // Also move the element as left as we can
      while (l.left > 0 && !getFirstCollision(compareWith, l)) {
        l.left--;
      }
    }
  }

  // Ensure that there are no negative positions
  l.top = Math.max(l.top, 0);
  l.left = Math.max(l.left, 0);

  return l;
}

export function bottom(layout) {
  let max = 0,
    bottomY;
  for (let i = 0, len = layout.length; i < len; i++) {
    bottomY = layout[i].top + layout[i].height;
    if (bottomY > max) max = bottomY;
  }
  return max;
}

function resolveCompactionCollision(layout, item, moveToCoord, axis) {
  const sizeProp = heightWidth[axis];
  item[axis] += 1;
  const itemIndex = layout
    .map((layoutItem) => {
      return layoutItem.i;
    })
    .indexOf(item.i);

  // Go through each item we collide with.
  for (let i = itemIndex + 1; i < layout.length; i++) {
    const otherItem = layout[i];
    // Ignore static items
    if (otherItem.static) continue;

    // Optimization: we can break early if we know we're past this el
    // We can do this b/c it's a sorted layout
    if (otherItem.top > item.top + item.height) break;

    if (collides(item, otherItem)) {
      resolveCompactionCollision(layout, otherItem, moveToCoord + item[sizeProp], axis);
    }
  }

  item[axis] = moveToCoord;
}

// Keyed by the axis names callers pass ('x' | 'top'), not react-grid-layout's ('x' | 'y').
const heightWidth = { x: 'width', top: 'height' };

function sortLayoutItems(layout, compactType) {
  if (compactType === 'horizontal') return sortLayoutItemsByColRow(layout);
  if (compactType === 'vertical') return sortLayoutItemsByRowCol(layout);
  else return layout;
}

function sortLayoutItemsByColRow(layout) {
  return layout.slice(0).sort(function (a, b) {
    if (a.left > b.left || (a.left === b.left && a.top > b.top)) {
      return 1;
    }
    return -1;
  });
}

/**
 * Sort layout items by top ascending and left ascending.
 *
 * Does not modify the original layout.
 */
function sortLayoutItemsByRowCol(layout) {
  // Slice to clone the array as sort modifies the original array
  return layout.slice(0).sort(function (a, b) {
    if (a.top > b.top || (a.top === b.top && a.left > b.left)) {
      return 1;
    } else if (a.top === b.top && a.left === b.left) {
      // Without this, we can get different sort results in IE vs. Chrome/FF
      return 0;
    }
    return -1;
  });
}
