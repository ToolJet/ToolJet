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
  const threshold = Number(stackBelow);
  if (!Number.isFinite(threshold) || threshold <= 0) return false;
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

export const getNextFlexChildOrderOnInsert = ({ childOrder = [], actualChildIds = [], childId, targetIndex }) => {
  const baseOrder = normalizeChildOrder(childOrder, actualChildIds);
  return insertId(baseOrder, childId, targetIndex);
};

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

/**
 * Resolves sizing for a FlexContainer child from its layout object.
 *
 * Width may fill; height is fixed.
 */
export const resolveFlexChildSizing = (layoutData = {}, fallbacks = {}) => {
  const fallbackWidthPx = fallbacks.widthPx ?? null;
  const fallbackHeight = fallbacks.height ?? null;

  const fillWidth = layoutData.fillWidth !== undefined ? layoutData.fillWidth : true;

  const widthPx = layoutData.widthPx ?? fallbackWidthPx ?? null;
  const height = layoutData.height ?? fallbackHeight ?? null;

  // Row fill children share the free space by `grow` (2 next to 1 takes two thirds) and wrap to a new line once
  // narrower than `minWidthPx` (when the container wraps).
  const grow = Number(layoutData.grow);
  const minWidthPx = Number(layoutData.minWidthPx);

  return {
    fillWidth,
    widthPx,
    height,
    grow: Number.isFinite(grow) && grow > 0 ? grow : 1,
    minWidthPx: Number.isFinite(minWidthPx) && minWidthPx > 0 ? minWidthPx : 0,
  };
};

/**
 * Flex sizing of a FlexContainer child's wrapper.
 *
 * A fill child in a row starts from a zero basis and may shrink, so siblings share the line by `grow` and the
 * child's own content can never claim the row. (A content-sized basis let a fill child rendered at the row's width
 * push its siblings off the line, and a nested container measuring its own width grew without end.)
 */
export const computeFlexChildFlexStyle = ({
  isFlexRow,
  flexShouldStack,
  fillWidth,
  grow = 1,
  minWidthPx = 0,
  effectiveWidthPx,
  effectiveHeightPx,
  availableWidth,
}) => {
  if (flexShouldStack && !isFlexRow) {
    return {
      flex: `0 0 ${effectiveHeightPx}px`,
      height: `${effectiveHeightPx}px`,
      minHeight: 0,
      ...(fillWidth
        ? { width: '100%', minWidth: 0 }
        : { width: `${Math.min(effectiveWidthPx, availableWidth)}px`, maxWidth: '100%', minWidth: 0 }),
    };
  }
  if (isFlexRow) {
    return fillWidth
      ? { flex: `${grow} 1 0px`, minWidth: `${minWidthPx}px`, height: `${effectiveHeightPx}px` }
      : { flex: `0 0 ${effectiveWidthPx}px`, minWidth: 0, maxWidth: '100%', height: `${effectiveHeightPx}px` };
  }
  return { flex: `0 0 ${effectiveHeightPx}px`, width: fillWidth ? '100%' : `${effectiveWidthPx}px`, minHeight: 0 };
};

/** Width a child takes on a wrapping line, as the browser packs it: a fill child its minimum, a fixed child its width. */
export const flexChildLineWidth = ({ fillWidth, minWidthPx = 0, width }) => (fillWidth ? minWidthPx || 0 : width);

/** Height of the card header a FlexContainer draws above its body (component packs): an Ant card's 56px bar with
 *  title and extra, or a shadcn card's title with an optional description beneath it. */
export const FLEX_CARD_HEADER_PX = 56;
export const SHADCN_CARD_HEADER_PX = { title: 48, withDescription: 70 };
export const flexCardHeaderPx = (properties = {}) => {
  const { cardStyle, cardTitle, cardExtra } = properties;
  if (cardStyle === 'antCard') return cardTitle || cardExtra ? FLEX_CARD_HEADER_PX : 0;
  if (cardStyle === 'shadcnCard') {
    if (!cardTitle && !cardExtra) return 0;
    return cardExtra ? SHADCN_CARD_HEADER_PX.withDescription : SHADCN_CARD_HEADER_PX.title;
  }
  return 0;
};

/** Default flex-child layout when a widget is first dropped into a FlexContainer. */
export const createDefaultFlexChildLayout = ({ widthPx, height }) => ({
  fillWidth: true,
  widthPx,
  height,
});

/**
 * Returns the insertion slot index for a given mouse position.
 * direction: 'column' (default) uses Y as main axis; 'row' uses X as main axis.
 *
 * Wrap-aware: groups children into buckets by cross-axis position (row for row-direction,
 * column for column-direction), picks the bucket containing the cursor's cross coord
 * (or nearest if between buckets), then resolves the main-axis insertion index inside it.
 */
const computeInsertionIndex = (rects, mousePos, direction = 'column') => {
  if (!rects || rects.length === 0) return 0;
  const isRow = direction === 'row';
  const mainStart = isRow ? 'left' : 'top';
  const mainLength = isRow ? 'width' : 'height';
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
    const mid = r[mainStart] + r[mainLength] / 2;
    if (mouseMain < mid) return target.items[i].index;
  }
  // Cursor past every child in this bucket — insert after the bucket's last item.
  return target.items[target.items.length - 1].index + 1;
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
