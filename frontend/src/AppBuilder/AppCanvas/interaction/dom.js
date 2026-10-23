/**
 * The few DOM facts the canvas engine reads. Every canvas is a `.real-canvas` element whose `data-parentId` is its
 * slot id; every editable component is a `.moveable-box` element whose `widgetid` is its id. Components are placed
 * from their canvas's content edge, `left` columns × the canvas's column width across and `top` px down.
 */
import { useGridStore } from '@/_stores/gridStore';
import { COLUMNS } from './geometry';

export const PAGE_CANVAS = 'canvas';

/** The slot id of a canvas element: 'canvas' for the page canvas. */
export const slotOfCanvas = (canvasEl, moduleId = PAGE_CANVAS) => {
  const slot = canvasEl.getAttribute('data-parentId');
  return canvasEl.id === 'real-canvas' || slot === moduleId ? PAGE_CANVAS : slot;
};

/** The canvas a component element sits in. */
export const canvasOfComponent = (componentEl) => componentEl.parentElement?.closest('.real-canvas') ?? null;

/** The editable element of a component (in a Listview, its first row's). */
export const componentElement = (root, id) => root.querySelector(`.moveable-box[widgetid="${id}"]`);

/** Width of one column of a canvas, as its components are rendered with. */
export const columnWidthOf = (canvasEl, slot, moduleId = PAGE_CANVAS) => {
  const widths = useGridStore.getState().subContainerWidths;
  const known = widths[slot === PAGE_CANVAS ? moduleId : slot] ?? widths[slot];
  if (known) return known;
  const style = window.getComputedStyle(canvasEl);
  const content = canvasEl.clientWidth - (parseFloat(style.paddingLeft) || 0) - (parseFloat(style.paddingRight) || 0);
  return Math.max(0, Math.floor(content) - 1) / COLUMNS || 1;
};

/** Viewport position of a canvas's content edge, where its components' `left`/`top` are measured from. */
export const contentOrigin = (canvasEl) => {
  const rect = canvasEl.getBoundingClientRect();
  const style = window.getComputedStyle(canvasEl);
  return {
    x: rect.left + canvasEl.clientLeft + (parseFloat(style.paddingLeft) || 0) - canvasEl.scrollLeft,
    y: rect.top + canvasEl.clientTop + (parseFloat(style.paddingTop) || 0) - canvasEl.scrollTop,
  };
};

/** Height of a canvas's content box: how far down its visible area reaches. */
export const contentHeight = (canvasEl) => {
  const style = window.getComputedStyle(canvasEl);
  return canvasEl.clientHeight - (parseFloat(style.paddingTop) || 0) - (parseFloat(style.paddingBottom) || 0);
};

/**
 * The innermost canvas under a point, skipping canvases inside `exclude` (the components being dragged, so a
 * container can't be dropped into itself) and canvases outside `root`.
 */
export const canvasAt = (root, { x, y }, exclude = []) => {
  for (const el of document.elementsFromPoint(x, y)) {
    if (!root.contains(el) || exclude.some((excluded) => excluded.contains(el))) continue;
    if (el.classList.contains('real-canvas')) return el;
    // Over a component's own frame, between its canvases (around a header slot): its nearest canvas.
    if (el.classList.contains('moveable-box')) {
      const nearest = nearestCanvas(el, x, y);
      if (nearest) return nearest;
    }
  }
  return null;
};

/** A component's own canvases that show (a container's body, header and footer), with their rects. */
const canvasesOf = (box) =>
  [...box.querySelectorAll('.real-canvas')]
    .filter((canvas) => canvas.closest('.moveable-box') === box)
    .map((canvas) => ({ canvas, r: canvas.getBoundingClientRect() }))
    .filter(({ r }) => r.width && r.height);

/** The canvas among `candidates` with the lowest score, if any scores (a score below 0 doesn't). */
const best = (candidates, score) => {
  let found = null;
  let lowest = Infinity;
  for (const candidate of candidates) {
    const value = score(candidate.r);
    if (value >= 0 && value < lowest) [found, lowest] = [candidate.canvas, value];
  }
  return found;
};

const nearestCanvas = (box, x, y) =>
  best(canvasesOf(box), (r) => Math.hypot(Math.max(r.left - x, 0, x - r.right), Math.max(r.top - y, 0, y - r.bottom)));

/**
 * The next canvas of the same component as `canvasEl` in the direction of `v` (along its main axis) that `accepts`
 * allows, if any.
 */
export const nextCanvas = (canvasEl, v, accepts = () => true) => {
  const box = componentOfCanvas(canvasEl);
  if (!box) return null;
  const from = canvasEl.getBoundingClientRect();
  const others = canvasesOf(box).filter(({ canvas }) => canvas !== canvasEl && accepts(canvas));
  if (Math.abs(v.y) >= Math.abs(v.x)) {
    return best(others, (r) => (v.y > 0 ? r.top - from.bottom : from.top - r.bottom) + 1);
  }
  return best(others, (r) => (v.x > 0 ? r.left - from.right : from.left - r.right) + 1);
};

/** Where new elements placed among a canvas's components go: beside them, so they are positioned the same way. */
export const layerOf = (canvasEl) => canvasEl.querySelector(':scope > .rm-container') ?? canvasEl;

/** Is the element something the user types or selects text in? */
export const isEditable = (el) =>
  !!el.closest('input, textarea, select, [contenteditable="true"], [contenteditable=""]');

/**
 * Areas inside a component that handle their own pointer gestures (table column resizing, kanban cards, slider
 * thumbs, date pickers); a press there selects the component but does not move it.
 */
const OWN_GESTURE_AREAS = {
  Table: '.jet-data-table',
  Calendar: '.rbc-month-view',
  Kanban: '.handle-container',
  ReorderableList: '.reorderable-list-items',
  KeyValuePair: '.kv-editable',
};
const HANDLE_ONLY = ['RangeSlider', 'RangeSliderV2', 'BoundedBox'];

export const pressStartsMove = (target, componentEl, type) => {
  if (isEditable(target) || target.closest('.react-datepicker-popper')) return false;
  // Sliders and boxes move only by their config handle: a press anywhere else is the component's own.
  if (HANDLE_ONLY.includes(type)) return !!target.closest('.handle-content');
  const area = OWN_GESTURE_AREAS[type];
  if (area) {
    const inner = target.closest(area);
    if (inner && componentEl.contains(inner)) return false;
  }
  return true;
};

/** The component a canvas belongs to (a container, for its body, header and footer); none for the page. */
export const componentOfCanvas = (canvasEl) => canvasEl?.closest('.moveable-box') ?? null;

/** The visible part of the page around `el`: its outermost scrolling ancestor (else `root`), within the window. */
export const visibleArea = (el, root) => {
  let area = root;
  for (let node = el; node && node !== root; node = node.parentElement) {
    if (/(auto|scroll)/.test(window.getComputedStyle(node).overflowY)) area = node;
  }
  const r = area.getBoundingClientRect();
  return {
    left: Math.max(r.left, 0),
    top: Math.max(r.top, 0),
    right: Math.min(r.right, window.innerWidth),
    bottom: Math.min(r.bottom, window.innerHeight),
  };
};

/**
 * The part of `el` on screen (within the window and every scroller around it), and which of its own edges are hidden
 * beyond that (a canvas taller than what shows of the canvas around it).
 */
export const visibleRect = (el, root) => {
  const r = el.getBoundingClientRect();
  const v = { left: Math.max(r.left, 0), top: Math.max(r.top, 0), right: r.right, bottom: r.bottom };
  v.right = Math.min(v.right, window.innerWidth);
  v.bottom = Math.min(v.bottom, window.innerHeight);
  for (const scroller of scrollersAbove(el.parentElement, root)) {
    const s = scroller.getBoundingClientRect();
    v.left = Math.max(v.left, s.left);
    v.top = Math.max(v.top, s.top);
    v.right = Math.min(v.right, s.right);
    v.bottom = Math.min(v.bottom, s.bottom);
  }
  v.width = Math.max(0, v.right - v.left);
  v.height = Math.max(0, v.bottom - v.top);
  // An edge shows only with its last pixel row (where a canvas's border is drawn) in view: sub-pixel slack, no more.
  v.hidden = {
    top: r.top < v.top - 0.5,
    bottom: r.bottom > v.bottom + 0.5,
    left: r.left < v.left - 0.5,
    right: r.right > v.right + 0.5,
  };
  return v;
};

/** The elements at or above `el` (inside `root`'s parent) that scroll, innermost first. */
export const scrollersAbove = (el, root) => {
  const scrollers = [];
  for (let node = el; node && node !== root.parentElement; node = node.parentElement) {
    const style = window.getComputedStyle(node);
    const scrollsY = /(auto|scroll)/.test(style.overflowY) && node.scrollHeight > node.clientHeight;
    const scrollsX = /(auto|scroll)/.test(style.overflowX) && node.scrollWidth > node.clientWidth;
    if (scrollsY || scrollsX) scrollers.push(node);
  }
  return scrollers;
};
