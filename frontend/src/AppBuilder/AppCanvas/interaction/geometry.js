/**
 * Canvas geometry for the editor's drag / resize / marquee gestures. Pure: no DOM, no store.
 *
 * Units are the saved layout's: `left`/`width` in columns of the canvas's NO_OF_GRIDS-column grid, `top`/`height`
 * in px on a GRID_HEIGHT-px row grid. A gesture is a pointer offset in px from where it started; every function here
 * turns that into the box that will be saved, so what the editor shows during a gesture is exactly what is saved.
 */
import { NO_OF_GRIDS, GRID_HEIGHT } from '../appCanvasConstants';

export const COLUMNS = NO_OF_GRIDS;
export const ROW = GRID_HEIGHT;

export const snapRow = (px) => Math.round(px / ROW) * ROW;
/** The last row line at or above `px`. */
const rowAtOrAbove = (px) => Math.floor(px / ROW) * ROW;

/**
 * Pixel offset of column line `column` on a grid of `gridWidth`-px columns, a whole pixel. Components, drop ghosts,
 * frames and grid lines are all drawn from it, so they meet on the same pixels however the canvas width divides.
 */
export const columnEdge = (column, gridWidth) => Math.round(column * gridWidth);

/** Pixel left and width of `width` columns starting at column `left`. */
export const columnSpan = (left, width, gridWidth) => {
  const start = columnEdge(left, gridWidth);
  return { x: start, width: columnEdge(left + width, gridWidth) - start };
};
export const snapColumn = (px, gridWidth) => Math.round(px / gridWidth);

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/** The canvas a box must stay in: all columns, from the first row down to `bottom` px (Infinity: unbounded). */
export const canvasBounds = (bottom = Infinity) => ({ columns: COLUMNS, bottom });

/**
 * Keeps a box inside its canvas by moving it, never by resizing it (a box wider than the canvas is narrowed to it).
 * A box taller than a bounded canvas is pinned to the top.
 */
export const keepInside = (box, bounds = canvasBounds()) => {
  const width = clamp(box.width, 1, bounds.columns);
  const left = clamp(box.left, 0, bounds.columns - width);
  const maxTop = Number.isFinite(bounds.bottom) ? Math.max(0, rowAtOrAbove(bounds.bottom - box.height)) : Infinity;
  return { ...box, left, width, top: clamp(box.top, 0, maxTop) };
};

/**
 * Where a box lands when its top-left corner is at (`x`, `y`) px from the canvas's content edge: the nearest grid
 * cell, inside the canvas.
 */
export const landAt = ({ x, y }, { width, height }, gridWidth, bounds) =>
  keepInside({ left: snapColumn(x, gridWidth), top: snapRow(y), width, height }, bounds);

/** A width in columns of one grid carried to another grid at the same pixel width (at least 1, at most all). */
export const convertWidth = (width, fromGridWidth, toGridWidth) => {
  if (!fromGridWidth || !toGridWidth || fromGridWidth === toGridWidth) return width;
  return clamp(Math.round((width * fromGridWidth) / toGridWidth), 1, COLUMNS);
};

const HANDLE_AXES = {
  n: [0, -1],
  s: [0, 1],
  e: [1, 0],
  w: [-1, 0],
  ne: [1, -1],
  nw: [-1, -1],
  se: [1, 1],
  sw: [-1, 1],
};

export const HANDLES = Object.keys(HANDLE_AXES);

/** [x, y] of a handle: -1 moves the left/top edge, 1 the right/bottom edge, 0 neither. */
export const handleAxes = (handle) => HANDLE_AXES[handle] ?? [0, 0];

/**
 * The box a resize leaves. The edges the handle grabs follow the pointer (`dx`, `dy` px since the gesture began),
 * each snapped to its nearest grid line; the other edges stay; no edge leaves the canvas; at least one column and one
 * row remain. An edge pushed against the canvas boundary stops there, it never pushes the opposite edge.
 */
export const resizeBox = (box, handle, { dx, dy }, gridWidth, bounds = canvasBounds()) => {
  const [ax, ay] = handleAxes(handle);

  let left = box.left;
  let right = box.left + box.width;
  if (ax === 1) right = clamp(Math.round(right + dx / gridWidth), left + 1, bounds.columns);
  if (ax === -1) left = clamp(Math.round(left + dx / gridWidth), 0, right - 1);

  let top = box.top;
  let bottom = box.top + box.height;
  if (ay === 1) bottom = clamp(snapRow(bottom + dy), top + ROW, Math.max(top + ROW, rowAtOrAbove(bounds.bottom)));
  if (ay === -1) top = clamp(snapRow(top + dy), 0, bottom - ROW);

  return { left, width: right - left, top, height: bottom - top };
};

/** The smallest box around `boxes`. */
export const boundingBox = (boxes) => {
  const left = Math.min(...boxes.map((b) => b.left));
  const top = Math.min(...boxes.map((b) => b.top));
  const right = Math.max(...boxes.map((b) => b.left + b.width));
  const bottom = Math.max(...boxes.map((b) => b.top + b.height));
  return { left, top, width: right - left, height: bottom - top };
};

/**
 * Moves a group so that its bounding box lands where `land` puts it; every member shifts by the same whole number
 * of columns and rows, so the arrangement inside the group is kept exactly.
 */
export const moveGroup = (boxes, landedGroupBox) => {
  const group = boundingBox(boxes);
  const dLeft = landedGroupBox.left - group.left;
  const dTop = landedGroupBox.top - group.top;
  return boxes.map((b) => ({ ...b, left: b.left + dLeft, top: b.top + dTop }));
};

/**
 * Resizes a group by resizing its bounding box and scaling each member inside it: positions and sizes scale with
 * the group, each snapped to the grid, each at least one column and one row.
 */
export const resizeGroup = (boxes, handle, delta, gridWidth, bounds = canvasBounds()) => {
  const from = boundingBox(boxes);
  const to = resizeBox(from, handle, delta, gridWidth, bounds);
  const sx = to.width / from.width;
  const sy = to.height / from.height;
  return boxes.map((b) => {
    const left = to.left + Math.round((b.left - from.left) * sx);
    const right = to.left + Math.round((b.left + b.width - from.left) * sx);
    const top = to.top + snapRow((b.top - from.top) * sy);
    const bottom = to.top + snapRow((b.top + b.height - from.top) * sy);
    return {
      ...b,
      left: Math.min(left, COLUMNS - 1),
      width: Math.max(1, right - left),
      top,
      height: Math.max(ROW, bottom - top),
    };
  });
};

/** Pixel rectangle of a grid box (top-left from the canvas's content edge). */
export const toPixels = (box, gridWidth) => ({
  x: box.left * gridWidth,
  y: box.top,
  width: box.width * gridWidth,
  height: box.height,
});

/** Do two rectangles ({left, top, right, bottom}) overlap, touching edges excluded? */
export const intersects = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

/** The rectangle spanned by two points. */
export const rectFromPoints = (a, b) => ({
  left: Math.min(a.x, b.x),
  top: Math.min(a.y, b.y),
  right: Math.max(a.x, b.x),
  bottom: Math.max(a.y, b.y),
});

/** Has the pointer moved far enough from where it went down to be a drag rather than a click? */
export const DRAG_THRESHOLD_PX = 3;
export const pastThreshold = (start, point) =>
  Math.abs(point.x - start.x) > DRAG_THRESHOLD_PX || Math.abs(point.y - start.y) > DRAG_THRESHOLD_PX;

// ── Gesture input ───────────────────────────────────────────────────────────────────────────────────────────────

/** Whether `point` is inside `r`, grown by `margin` on every side. */
export const within = (r, point, margin = 0) =>
  point.x > r.left - margin && point.x < r.right + margin && point.y > r.top - margin && point.y < r.bottom + margin;

/** How deep a push must reach into a smaller canvas: a share of its size, at most a fixed depth. */
export const PUSH_SHARE = 0.4;
export const PUSH_MAX_PX = 24;

/**
 * Whether `point` has been pushed into rect `into` from `from`, its neighbour: PUSH_SHARE of its size (at most
 * PUSH_MAX_PX) past the edge they share.
 */
export const pushedInto = (into, from, point) => {
  const above = into.bottom <= from.top + 1;
  const below = into.top >= from.bottom - 1;
  const left = into.right <= from.left + 1;
  const depth = above
    ? into.bottom - point.y
    : below
      ? point.y - into.top
      : left
        ? into.right - point.x
        : point.x - into.left;
  const size = above || below ? into.bottom - into.top : into.right - into.left;
  return depth >= Math.min(PUSH_MAX_PX, PUSH_SHARE * size);
};

/**
 * Velocity (px per ms) of a pointer's recent positions `{ t, x, y }`. Each step counts as 8–16 ms, so events that
 * arrive together or after a pause don't skew it.
 */
export const velocityOf = (moves) => {
  let x = 0;
  let y = 0;
  let t = 0;
  for (let i = 1; i < moves.length; i++) {
    x += moves[i].x - moves[i - 1].x;
    y += moves[i].y - moves[i - 1].y;
    t += clamp(moves[i].t - moves[i - 1].t, 8, 16);
  }
  return t ? { x: x / t, y: y / t } : { x: 0, y: 0 };
};
