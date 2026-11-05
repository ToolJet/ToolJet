import { GRID_HEIGHT, NO_OF_GRIDS } from '@/AppBuilder/AppCanvas/appCanvasConstants';

// ─────────────────────────────────────────────────────────────────────────────
// Dynamic-height solver — pure, no DOM, no store.
//
// A box is one widget's SAVED layout inside one container:
//   { id, top, left, width, height, collapsible?, updatedAt? }
// `height` is the saved height the builder drew (calc-bumped for top-label
// inputs). `collapsible` marks a widget with collapseWhenHidden on.
//
// The rule, applied top to bottom in saved order:
//
//   top(W) = W has no blockers ? W.top
//          : max over blockers B of  top(B) + flow(B) + (W.top − B.savedBottom)
//
// flow(B) is B's current height (0 when hidden and collapsed). A blocker is a
// widget that shares a column with W and comes first in saved order; the
// column sweep keeps only the nearest one per column, plus any it overlaps.
// Nothing here remembers an earlier pass, so the same heights always give the
// same layout.
// ─────────────────────────────────────────────────────────────────────────────

const toTime = (value) => (value ? new Date(value).getTime() : null);

export const compareBoxes = (a, b) => {
  if (a.top !== b.top) return a.top - b.top;
  if (a.left !== b.left) return a.left - b.left;
  // Widgets dropped on the same spot: the most recently positioned one sorts last.
  const aTime = toTime(a.updatedAt);
  const bTime = toTime(b.updatedAt);
  if (aTime !== null && bTime !== null && aTime !== bTime) return aTime - bTime;
  return String(a.id).localeCompare(String(b.id));
};

export const sortBoxes = (boxes) => [...boxes].sort(compareBoxes);

const columnSpan = (box) => {
  const start = Math.max(0, Math.floor(box.left ?? 0));
  const end = Math.min(NO_OF_GRIDS, Math.ceil((box.left ?? 0) + (box.width ?? 0)));
  return [start, Math.max(start, end)];
};

// The bottom the gap below `blocker` is measured from. A collapse-when-hidden
// widget is drawn as a 0 px strip while hidden, so a widget the builder placed
// inside its area keeps its offset from the blocker's top instead.
const gapBottom = (blocker, targetTop) => {
  const savedBottom = blocker.top + blocker.height;
  return blocker.collapsible && targetTop < savedBottom ? blocker.top : savedBottom;
};

// Advances one column's open set past `box`: keeps the widgets `box` overlaps
// vertically (they still block whatever comes below), then adds `box`.
const advanceSlot = (slot, box) => {
  const next = slot.filter((open) => box.top < open.top + open.height);
  next.push(box);
  return next;
};

// Blockers for every box. `sortedBoxes` must be in compareBoxes order.
// Depends only on saved layouts, so callers can cache it until a layout edit.
export const buildBlockers = (sortedBoxes) => {
  const slots = Array.from({ length: NO_OF_GRIDS }, () => []);
  const blockers = new Map();
  for (const box of sortedBoxes) {
    const above = new Set();
    const [start, end] = columnSpan(box);
    for (let column = start; column < end; column++) {
      for (const open of slots[column]) above.add(open);
      slots[column] = advanceSlot(slots[column], box);
    }
    blockers.set(box.id, [...above]);
  }
  return blockers;
};

// How far below `blocker`'s rendered bottom `box` sits. A collapsed widget
// gives up its gap as well as its height, so what was drawn below it moves up
// to its top, as the existing engine does.
const offsetBelow = (blocker, box, flow) => {
  if (blocker.collapsible && flow === 0 && box.top >= blocker.top + blocker.height) return 0;
  return box.top - gapBottom(blocker, box.top);
};

const topFromBlockers = (box, above, tops, flowOf) => {
  if (above.length === 0) return box.top;
  let top = -Infinity;
  for (const blocker of above) {
    const flow = flowOf(blocker.id);
    const pushed = tops.get(blocker.id) + flow + offsetBelow(blocker, box, flow);
    if (pushed > top) top = pushed;
  }
  return top;
};

// Rendered top for every box. `flowOf(id)` returns the current flow height.
export const solveTops = (sortedBoxes, blockers, flowOf) => {
  const tops = new Map();
  for (const box of sortedBoxes) {
    tops.set(box.id, topFromBlockers(box, blockers.get(box.id) || [], tops, flowOf));
  }
  return tops;
};

// Convenience wrapper: sort, sweep and solve one container.
// Returns rendered tops and the content bottom (max rendered bottom).
export const solveContainer = (boxes, flowOf) => {
  const sorted = sortBoxes(boxes);
  const tops = solveTops(sorted, buildBlockers(sorted), flowOf);
  let bottom = 0;
  for (const box of sorted) {
    const flow = flowOf(box.id);
    if (flow > 0) bottom = Math.max(bottom, tops.get(box.id) + flow);
  }
  return { tops, bottom, sorted };
};

// Blockers a NEW box would get if it were saved at `top`, without re-running
// the sweep for the whole container. Only the box's own columns are walked.
const blockersAt = (sortedSiblings, candidate) => {
  const above = new Set();
  const [start, end] = columnSpan(candidate);
  for (let column = start; column < end; column++) {
    let slot = [];
    for (const sibling of sortedSiblings) {
      if (compareBoxes(sibling, candidate) >= 0) break;
      const [siblingStart, siblingEnd] = columnSpan(sibling);
      if (column < siblingStart || column >= siblingEnd) continue;
      slot = advanceSlot(slot, sibling);
    }
    for (const open of slot) above.add(open);
  }
  return [...above];
};

// Rendered top of a box saved at `top`, given the solved layout of the others.
export const renderedTopFor = ({ top, left, width, height = 0, id = '￿' }, sortedSiblings, tops, flowOf) => {
  const candidate = { id, top, left, width, height };
  return topFromBlockers(candidate, blockersAt(sortedSiblings, candidate), tops, flowOf);
};

// Inverse of the rule, used when the builder drops, pastes or adds a widget
// where they can see it: the saved top whose rendered top lands closest to
// `visibleTop`. Pushes take the maximum across blockers, so a guess of
// "visible minus the largest shift above" is exact in the common case; the
// grid search around it settles drops that can't be shown exactly (inside a
// grown widget's extra strip) and prefers the lower saved top on ties, so a
// drop under a collapsed widget is pushed, not overlapped, when it reappears.
export const savedTopForVisibleTop = ({
  visibleTop,
  left,
  width,
  height = 0,
  siblings,
  tops,
  flowOf,
  step = GRID_HEIGHT,
  searchRows = 40,
}) => {
  const sortedSiblings = sortBoxes(siblings);
  const [start, end] = columnSpan({ left, width });
  let shift = 0;
  for (const sibling of sortedSiblings) {
    const [siblingStart, siblingEnd] = columnSpan(sibling);
    if (siblingEnd <= start || siblingStart >= end) continue;
    const renderedTop = tops.get(sibling.id);
    if (renderedTop === undefined || renderedTop > visibleTop) continue;
    shift = Math.max(shift, renderedTop + flowOf(sibling.id) - (sibling.top + sibling.height));
  }

  const snap = (value) => Math.max(0, Math.round(value / step) * step);
  const guess = snap(visibleTop - shift);
  let best = null;
  for (let row = -searchRows; row <= searchRows; row++) {
    const candidate = guess + row * step;
    if (candidate < 0) continue;
    const rendered = renderedTopFor({ top: candidate, left, width, height }, sortedSiblings, tops, flowOf);
    const distance = Math.abs(rendered - visibleTop);
    if (!best || distance < best.distance || (distance === best.distance && candidate > best.top)) {
      best = { top: candidate, distance };
    }
  }
  return best ? best.top : snap(visibleTop);
};
