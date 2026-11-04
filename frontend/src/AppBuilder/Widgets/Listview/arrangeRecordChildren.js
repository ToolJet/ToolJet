import { listviewConfig } from '@tooljet/widget-definitions';
import { NO_OF_GRIDS } from '@/AppBuilder/AppCanvas/appCanvasConstants';

// A dropped row's widths (Image, Text, Button), so a row rebuilt from a stack looks like the original.
const DEFAULT_WIDTH_BY_TYPE = Object.fromEntries(
  listviewConfig.defaultChildren
    .filter((child) => !child.slotName)
    .map((child) => [child.componentName, child.layout.width])
);
const FALLBACK_WIDTH = 12;
const ROW_LEFT = 3;
const ROW_GAP = 2;
const STACK_LEFT = 1;
const STACK_WIDTH = NO_OF_GRIDS - 2 * STACK_LEFT;
const STACK_TOP = 10;
const STACK_MAX_GAP = 10;

const byLeftThenTop = (a, b) => a.layout.left - b.layout.left || a.layout.top - b.layout.top;
const byTopThenLeft = (a, b) => a.layout.top - b.layout.top || a.layout.left - b.layout.left;

const arrangeRow = (children, recordHeight) => {
  const count = children.length;
  const gap = count > 1 ? Math.max(0, Math.min(ROW_GAP, Math.floor((NO_OF_GRIDS - count) / (count - 1)))) : 0;
  const preferred = children.map((child) => DEFAULT_WIDTH_BY_TYPE[child.componentName] ?? FALLBACK_WIDTH);
  const available = NO_OF_GRIDS - gap * (count - 1);
  const preferredSum = preferred.reduce((sum, width) => sum + width, 0);
  const widths =
    preferredSum > available
      ? preferred.map((width) => Math.max(1, Math.floor((width * available) / preferredSum)))
      : preferred;
  const total = widths.reduce((sum, width) => sum + width, 0) + gap * (count - 1);
  let left = Math.max(0, Math.min(ROW_LEFT, NO_OF_GRIDS - total));
  return Object.fromEntries(
    children.map((child, index) => {
      const { height } = child.layout;
      const placed = { top: Math.max(0, Math.round((recordHeight - height) / 2)), left, width: widths[index], height };
      left += widths[index] + gap;
      return [child.id, placed];
    })
  );
};

const arrangeStack = (children, recordHeight) => {
  const count = children.length;
  const free = recordHeight - 2 * STACK_TOP - children.reduce((sum, child) => sum + child.layout.height, 0);
  // Too tall for the card: keep the order and let them overflow rather than overlap.
  const fits = free >= 0;
  const gap = fits && count > 1 ? Math.min(STACK_MAX_GAP, Math.floor(free / (count - 1))) : 0;
  let top = fits ? STACK_TOP : 0;
  return Object.fromEntries(
    children.map((child) => {
      const placed = { top, left: STACK_LEFT, width: STACK_WIDTH, height: child.layout.height };
      top += child.layout.height + gap;
      return [child.id, placed];
    })
  );
};

/**
 * New layouts for every child of a ListView's record canvas when its Layout changes: one row in List, a vertical
 * stack in Grid. `children` is `{ id, componentName, layout }`; the order comes from the old Layout's reading order.
 */
export const arrangeRecordChildren = (children, { toMode, fromMode, recordHeight }) => {
  if (children.length === 0) return {};
  const ordered = [...children].sort(fromMode === 'grid' ? byTopThenLeft : byLeftThenTop);
  return toMode === 'grid' ? arrangeStack(ordered, recordHeight) : arrangeRow(ordered, recordHeight);
};
