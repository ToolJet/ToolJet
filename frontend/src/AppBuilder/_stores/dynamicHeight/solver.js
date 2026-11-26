import { NO_OF_GRIDS } from '@/AppBuilder/AppCanvas/appCanvasConstants';

// ─────────────────────────────────────────────────────────────────────────────
// Dynamic height solver: pure, no DOM, no store.
//
// It answers one question for one container: given each widget's saved layout
// and the height it renders at right now, where is each widget drawn?
//
// A box is one widget's SAVED layout in that container:
//   { id, top, left, width, height, collapsible?, updatedAt? }
// `left`/`width` are grid columns, `top`/`height` are px. `height` is the
// height the builder drew. `collapsible` marks a widget with "Collapse when
// hidden" on.
// ─────────────────────────────────────────────────────────────────────────────

// ── Saved order ─────────────────────────────────────────────────────────────
// Widgets are solved top to bottom in the order the builder laid them out, so
// every widget's blockers are solved before it.

const toTime = (value) => (value ? new Date(value).getTime() : null);

// Top, then left. Two widgets dropped on the same spot (stacked "Collapse when
// hidden" widgets, for example) keep the order they were positioned in: the most
// recent one is last, so it is drawn below the others. The id settles the rest.
//
// Ids compare by code point, not `localeCompare`: the order must not depend on
// the viewer's locale, and this runs inside every sort.
export const compareBoxes = (a, b) => {
  if (a.top !== b.top) return a.top - b.top;
  if (a.left !== b.left) return a.left - b.left;

  // Only reached on an exact tie, so parsing the dates here costs nothing in practice.
  const aTime = toTime(a.updatedAt);
  const bTime = toTime(b.updatedAt);
  if (aTime !== null && bTime !== null && aTime !== bTime) return aTime - bTime;

  const aId = String(a.id);
  const bId = String(b.id);
  if (aId === bId) return 0;
  return aId < bId ? -1 : 1;
};

// A sorted copy; the caller's list is left as it was.
export const sortBoxes = (boxes) => [...boxes].sort(compareBoxes);

// ── Blockers ────────────────────────────────────────────────────────────────
// A widget's blockers are the widgets that can push it down: in each column it
// covers, the nearest widget above it, plus any widget higher up that the
// nearest one overlaps (that widget can still grow past the nearest one's
// bottom).
//
// Found with one sweep down the container. Each of the grid's columns keeps
// its "open" widgets: the ones a widget arriving in that column sits under.
// That makes the sweep O(widgets × columns) instead of comparing every pair.

// The whole grid columns a box covers, as [first, end). A saved left or width
// can be fractional (older apps stored them), so the span is widened to whole
// columns and clamped to the grid.
const columnSpan = (box) => {
  const left = box.left ?? 0;
  const first = Math.max(0, Math.floor(left));
  const end = Math.min(NO_OF_GRIDS, Math.ceil(left + (box.width ?? 0)));
  return [first, Math.max(first, end)];
};

// Whether two boxes really share horizontal space. Needed on top of
// `columnSpan`: two boxes that only touch at a fractional edge (one ends at
// 10.5, the other starts there) land in the same whole column without
// overlapping.
const overlapsHorizontally = (a, b) => a.left < b.left + b.width && b.left < a.left + a.width;

// Moves one column's open widgets past `box`, in place. A widget that `box`
// sits fully below is closed: from here down, `box` stands in front of it.
// It stays open when `box` overlaps it (it can still grow past `box`) or only
// touches it at a fractional edge (`box` is not in front of it at all).
const advanceSlot = (slot, box) => {
  let kept = 0;
  for (const open of slot) {
    const coveredByBox = box.top >= open.top + open.height && overlapsHorizontally(open, box);
    if (!coveredByBox) slot[kept++] = open;
  }
  slot.length = kept;
  slot.push(box);
};

// Blockers of every box, as a Map of id → boxes. `sortedBoxes` must be in
// `compareBoxes` order. Depends only on saved layouts, so a caller can keep it
// until a layout is edited and reuse it for every height change.
export const buildBlockers = (sortedBoxes) => {
  const slots = Array.from({ length: NO_OF_GRIDS }, () => []);
  const blockers = new Map();

  for (const box of sortedBoxes) {
    const above = new Set(); // a wide blocker shows up in many columns; count it once
    const [first, end] = columnSpan(box);
    for (let column = first; column < end; column++) {
      for (const open of slots[column]) {
        if (overlapsHorizontally(open, box)) above.add(open);
      }
      advanceSlot(slots[column], box);
    }
    blockers.set(box.id, [...above]);
  }

  return blockers;
};

// ── Rendered tops ───────────────────────────────────────────────────────────
// The rule, applied in saved order:
//
//   top(W) = W.top                                     when W has no blockers
//   top(W) = max over blockers B of
//              top(B) + flow(B) + (W.top − B's saved bottom)
//
// In words: W keeps the gap the builder drew under each blocker, measured from
// where that blocker is drawn now and how tall it is now, and the blocker that
// reaches lowest wins. Taking the max (not adding the pushes up) is what keeps
// two side-by-side widgets that both grew from pushing W twice.
//
// flow(B) is B's current height: what it renders at, its saved height when it
// does not size to content, 0 when it is hidden and collapses. Nothing is
// remembered between passes, so the same heights always give the same layout.

// The bottom W's gap is measured from. Normally B's saved bottom. A widget the
// builder dropped onto a collapsible widget (above its saved bottom) was placed
// while that widget was drawn as a thin strip, so it keeps its offset from the
// widget's top instead and is pushed fully below it when the widget shows.
const gapBottom = (blocker, boxTop) => {
  const savedBottom = blocker.top + blocker.height;
  return blocker.collapsible && boxTop < savedBottom ? blocker.top : savedBottom;
};

// How far below B's rendered bottom W is drawn. A collapsed widget gives up
// the gap under it as well as its height: what was below it moves up to where
// its top was, as if it had never been placed.
const offsetBelow = (blocker, box, flow) => {
  const collapsed = blocker.collapsible && flow === 0;
  if (collapsed && box.top >= blocker.top + blocker.height) return 0;
  return box.top - gapBottom(blocker, box.top);
};

const topFromBlockers = (box, blockersOfBox, tops, flowOf) => {
  if (blockersOfBox.length === 0) return box.top;

  let top = -Infinity;
  for (const blocker of blockersOfBox) {
    const flow = flowOf(blocker.id);
    const pushedTo = tops.get(blocker.id) + flow + offsetBelow(blocker, box, flow);
    if (pushedTo > top) top = pushedTo;
  }
  return top;
};

// Rendered top of every box, as a Map of id → px. `sortedBoxes` in
// `compareBoxes` order, `blockers` from `buildBlockers`, `flowOf(id)` the
// current height. Saved order guarantees each blocker is solved first.
export const solveTops = (sortedBoxes, blockers, flowOf) => {
  const tops = new Map();
  for (const box of sortedBoxes) {
    tops.set(box.id, topFromBlockers(box, blockers.get(box.id) ?? [], tops, flowOf));
  }
  return tops;
};

// ── One container ───────────────────────────────────────────────────────────

// Solves one container: sort, sweep, solve. Returns the rendered tops (Map of
// id → px) and `bottom`, the lowest rendered bottom, which is how tall the
// container's content is. A collapsed widget (flow 0) takes no room, so it
// never sets the bottom.
//
// A caller solving the same container again for new heights only (no layout
// edit) can keep `sortBoxes` + `buildBlockers` and call `solveTops` alone.
export const solveContainer = (boxes, flowOf) => {
  const sorted = sortBoxes(boxes);
  const tops = solveTops(sorted, buildBlockers(sorted), flowOf);

  let bottom = 0;
  for (const box of sorted) {
    const flow = flowOf(box.id);
    if (flow > 0) bottom = Math.max(bottom, tops.get(box.id) + flow);
  }
  return { tops, bottom };
};
