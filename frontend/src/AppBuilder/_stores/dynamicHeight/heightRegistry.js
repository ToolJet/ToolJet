import { scheduleMeasuredHeights } from './scheduler';

// ─────────────────────────────────────────────────────────────────────────────
// Height registry — one ResizeObserver for every content-sized widget.
//
// The observer reports sizes the browser has already laid out, so measuring
// never forces a layout. Each element carries its widget's identity under a
// Symbol key, so a report maps back to its widget without a DOM query. Heights
// are rounded to whole pixels and unchanged values are dropped; the scheduler
// batches whatever is left into one engine pass per frame.
// ─────────────────────────────────────────────────────────────────────────────

const WIDGET = Symbol('dynamicHeightWidget');
const lastHeights = new Map();
const frozenKeys = new Set();

const handleResize = (entries) => {
  const changes = [];
  let get = null;
  for (const entry of entries) {
    const widget = entry.target[WIDGET];
    if (!widget) continue;
    const size = entry.borderBoxSize?.[0]?.blockSize ?? entry.target.offsetHeight;
    const height = Math.round(size);
    // 0 means the widget sits in a hidden tab, closed modal or collapsed
    // accordion; it reports again once it is shown.
    if (height === 0 || frozenKeys.has(widget.key) || lastHeights.get(widget.key) === height) continue;
    lastHeights.set(widget.key, height);
    changes.push({ ...widget, height });
    get = widget.get;
  }
  if (changes.length) scheduleMeasuredHeights(get, changes);
};

const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(handleResize) : null;

// `widget`: { key, id, contextIndices, moduleId, layout, get }.
export const observeHeight = (element, widget) => {
  if (!observer || !element) return;
  element[WIDGET] = widget;
  observer.observe(element);
};

export const unobserveHeight = (element, key) => {
  lastHeights.delete(key);
  if (!observer || !element) return;
  observer.unobserve(element);
  delete element[WIDGET];
};

// While frozen (e.g. a Table loading its data) reports are ignored, so the
// widget keeps its last height instead of collapsing to a spinner.
export const setHeightFrozen = (key, frozen) => {
  if (frozen) frozenKeys.add(key);
  else frozenKeys.delete(key);
};
