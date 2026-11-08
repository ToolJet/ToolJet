import { NO_OF_GRIDS } from '@/AppBuilder/AppCanvas/appCanvasConstants';

// A Text is not kept at its stacked width in a row: it would fill the row.
const TEXT_ROW_WIDTH = 12;
const ROW_LEFT = 3;
const ROW_GAP = 2;
const STACK_LEFT = 1;
const STACK_WIDTH = NO_OF_GRIDS - 2 * STACK_LEFT;
const STACK_TOP = 10;
const STACK_MAX_GAP = 10;

const byLeftThenTop = (a, b) => a.layout.left - b.layout.left || a.layout.top - b.layout.top;
const byTopThenLeft = (a, b) => a.layout.top - b.layout.top || a.layout.left - b.layout.left;

// A child keeps its pixel width across a Layout change, so a narrower grid card does not shrink it.
const toColumns = (child, { fromColumnPx, toColumnPx }) =>
  Math.max(1, Math.round((child.layout.width * fromColumnPx) / toColumnPx));

const arrangeRow = (children, recordHeight, px) => {
  const count = children.length;
  const gap = count > 1 ? Math.max(0, Math.min(ROW_GAP, Math.floor((NO_OF_GRIDS - count) / (count - 1)))) : 0;
  const preferred = children.map((child) =>
    child.componentName === 'Text' ? TEXT_ROW_WIDTH : Math.min(toColumns(child, px), NO_OF_GRIDS)
  );
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
      // Past 43 children the row cannot fit them all: later ones overlap at the right edge rather than leave the card.
      const placed = {
        top: Math.max(0, Math.round((recordHeight - height) / 2)),
        left: Math.min(left, NO_OF_GRIDS - widths[index]),
        width: widths[index],
        height,
      };
      left += widths[index] + gap;
      return [child.id, placed];
    })
  );
};

const arrangeStack = (children, recordHeight, px) => {
  const count = children.length;
  const free = recordHeight - 2 * STACK_TOP - children.reduce((sum, child) => sum + child.layout.height, 0);
  // Too tall for the card: keep the order and let them overflow rather than overlap.
  const fits = free >= 0;
  const gap = fits && count > 1 ? Math.min(STACK_MAX_GAP, Math.floor(free / (count - 1))) : 0;
  let top = fits ? STACK_TOP : 0;
  return Object.fromEntries(
    children.map((child) => {
      // Text fills the card; the rest keep their pixel width, capped at the card, at the left edge as in the Figma card.
      const width = child.componentName === 'Text' ? STACK_WIDTH : Math.min(toColumns(child, px), STACK_WIDTH);
      const placed = { top, left: STACK_LEFT, width, height: child.layout.height };
      top += child.layout.height + gap;
      return [child.id, placed];
    })
  );
};

/**
 * New layouts for every child of a ListView's record canvas when its Layout changes: one row in List, a vertical
 * stack in Grid. `children` is `{ id, componentName, layout }`; `*ColumnPx` is one column's pixels in each Layout; the order comes from the old Layout's reading order.
 */
export const arrangeRecordChildren = (
  children,
  { toMode, fromMode, recordHeight, fromColumnPx = 1, toColumnPx = 1 }
) => {
  if (children.length === 0) return {};
  const ordered = [...children].sort(fromMode === 'grid' ? byTopThenLeft : byLeftThenTop);
  const px = { fromColumnPx, toColumnPx };
  return toMode === 'grid' ? arrangeStack(ordered, recordHeight, px) : arrangeRow(ordered, recordHeight, px);
};

const pickBox = ({ top, left, width, height }) => ({ top, left, width, height });
const isBox = (box) => box && [box.top, box.left, box.width, box.height].every((value) => Number.isFinite(value));

/** The saved shape of one Layout's memory: every child's box, plus its Alignment when it has one, keyed by component id. */
export const snapshotRecordLayouts = (children) =>
  Object.fromEntries(
    children.map((child) => [
      child.id,
      { ...pickBox(child.layout), ...(child.alignment !== undefined && { alignment: child.alignment }) },
    ])
  );

/**
 * Layouts for the children when a Layout that has a memory is switched to: each remembered child gets its saved box;
 * children added since (no entry) are arranged as usual and placed after the remembered ones. Ids in the memory that
 * are no longer children are ignored.
 */
export const restoreRecordChildren = (children, remembered, options) => {
  const restored = children.filter((child) => isBox(remembered?.[child.id]));
  const added = children.filter((child) => !isBox(remembered?.[child.id]));
  const layouts = Object.fromEntries(restored.map((child) => [child.id, pickBox(remembered[child.id])]));
  if (added.length === 0) return layouts;

  const arranged = arrangeRecordChildren(added, options);
  const boxes = Object.values(layouts);
  if (boxes.length === 0) return arranged;

  const isGrid = options.toMode === 'grid';
  const [position, size, gap] = isGrid ? ['top', 'height', STACK_MAX_GAP] : ['left', 'width', ROW_GAP];
  const arrangedBoxes = Object.values(arranged);
  // A child that does not fit after the remembered ones is kept inside the card, each one a step apart so none hides another.
  let crowded = 0;
  const keepInside = (box) => {
    const maxTop = Math.max(0, options.recordHeight - box.height);
    const overflows = isGrid ? box.top > maxTop : box.left + box.width > NO_OF_GRIDS;
    if (!overflows) return box;
    const step = crowded++ * STACK_MAX_GAP;
    return {
      ...box,
      left: Math.max(0, Math.min(box.left, NO_OF_GRIDS - box.width)),
      top: isGrid ? Math.max(0, maxTop - step) : Math.min(box.top + step, maxTop),
    };
  };
  const shift =
    Math.max(...boxes.map((box) => box[position] + box[size])) +
    gap -
    Math.min(...arrangedBoxes.map((box) => box[position]));
  Object.entries(arranged).forEach(([id, box]) => {
    layouts[id] = keepInside({ ...box, [position]: box[position] + shift });
  });
  return layouts;
};
