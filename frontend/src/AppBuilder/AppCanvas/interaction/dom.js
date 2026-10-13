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
    if (!el.classList.contains('real-canvas') || !root.contains(el)) continue;
    if (exclude.some((excluded) => excluded.contains(el))) continue;
    return el;
  }
  return null;
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

/** The nearest element at or above `el` (inside `root`) that scrolls vertically or horizontally. */
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
