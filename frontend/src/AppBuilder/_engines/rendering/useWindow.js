import { useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useRef } from 'react';
import { createSizeIndex } from './sizeIndex';
import { anchorOf, createScrollModel, itemTop, listShape, windowTop } from './scrollModel';

// Before the scroll element is measured, as much as a tall list shows (the first layout pass corrects it).
const FIRST_VIEWPORT = 1200;
// Scrolling has stopped this long after the last scroll event.
const SETTLE_MS = 150;
// Items are rendered this far ahead in the direction of scrolling, per px/ms of scrolling speed (the browser scrolls on
// its own thread and can show a few frames before the items for them are rendered), up to LEAD_VIEWPORTS viewports.
const LEAD_MS = 120;
const LEAD_VIEWPORTS = 3;
// Measured heights kept for items (by key) beyond the list's own size index.
const MEASURED_LIMIT = 10000;
// A wheel event this recent means a scroll during a pointer press is the wheel's, not a scrollbar drag.
const WHEEL_RECENT_MS = 100;

const noop = () => {};

/**
 * Renders a window of a long list inside `scrollRef`'s element: the items in view and `overscan` px around them (more
 * ahead when scrolling fast), placed in a list element as tall as all the items (`height`), so the scrollbar spans
 * everything. Scrolling follows `scrollModel.js`: wheel, touch and keys move items 1:1, a scrollbar drag maps
 * proportionally, and lists taller than the browser allows are scaled without items ever moving on screen.
 *
 * - `estimateSize`: an item's height before it is measured: a number (every item) or a function of the index.
 * - `measure`: items can differ from the estimate: attach `measureElement` (with `data-index`) to each. A measured
 *   height is kept by the item's key (`getItemKey(i)`), so it survives sorting and expanding; `indexOfKey(key)` finds a
 *   key's item again. Without it, nothing is measured or observed.
 * - `listRef`: the list element, when something else in the scroll element comes before it (a sticky header): items
 *   are placed below it.
 * - `mountBudgetMs`: once the list is on screen, items new to the window mount within about this much time per frame,
 *   those nearest the view first; the rest mount on the next frames (`pending`). Infinity mounts them all at once.
 *
 * Each item is `{ index, key, start }`; its element's CSS `top` is `itemTop(start)`. Keep the item's content in a
 * component that doesn't take `start`, so moving an item doesn't re-render its content.
 *
 * Returns `{ items, height, itemTop, sizeAt, measureElement, resizeItem, scrollToIndex, isScrolling, pending, tick }`,
 * where `tick` changes whenever the window itself re-rendered the list.
 */
export function useWindow({
  count,
  scrollRef,
  listRef = null,
  estimateSize,
  getItemKey,
  indexOfKey = null,
  overscan = 400,
  measure = false,
  mountBudgetMs = Infinity,
}) {
  const [tick, rerender] = useReducer((n) => n + 1, 0);
  const model = useRef(null);
  if (!model.current) model.current = createScrollModel();
  const keyOf = useRef(getItemKey);
  keyOf.current = getItemKey;
  const overscanRef = useRef(overscan);
  overscanRef.current = overscan;
  const estimateOf = useRef(null);
  estimateOf.current = (i) => (typeof estimateSize === 'number' ? estimateSize : estimateSize(i));

  // Only heights that differ from the estimate are kept, the MEASURED_LIMIT most recent: items of one height leave
  // nothing to re-apply, and scrolling through millions of items doesn't keep a height for each.
  const measured = useRef(new Map()); // key → height
  const remember = (i, size) => {
    const key = keyOf.current(i);
    measured.current.delete(key);
    if (size === estimateOf.current(i)) return;
    measured.current.set(key, size);
    if (measured.current.size > MEASURED_LIMIT) measured.current.delete(measured.current.keys().next().value);
  };

  // Built once per list (items, order, expansions), then the measured heights still in the list.
  const sizes = useMemo(() => {
    const index = createSizeIndex(count, estimateSize);
    if (indexOfKey) {
      for (const [key, size] of measured.current) {
        const i = indexOfKey(key);
        if (i >= 0 && i < count) index.setSize(i, size);
      }
    }
    return index;
  }, [count, estimateSize, indexOfKey]);
  const sizesRef = useRef(sizes);
  sizesRef.current = sizes;

  // The viewport's height, how far down the scroll element the list starts, and the scrolling direction and speed.
  const viewport = useRef({ height: FIRST_VIEWPORT, margin: 0, direction: 0, speed: 0, at: 0 });
  const shapeOf = (index = sizesRef.current) =>
    listShape(index.total(), viewport.current.height, undefined, viewport.current.margin);
  const listRefRef = useRef(listRef);
  listRefRef.current = listRef;
  // Read when the scroll element or its size changes, not while scrolling (it forces a layout).
  const measureMargin = (el) => {
    const list = listRefRef.current?.current;
    if (!list || !el) return 0;
    return list.getBoundingClientRect().top - el.getBoundingClientRect().top + el.scrollTop;
  };

  const windowOf = (index) => {
    const shape = shapeOf(index);
    const { direction, speed, height } = viewport.current;
    const lead = Math.min(speed * LEAD_MS, height * LEAD_VIEWPORTS);
    const before = overscanRef.current + (direction < 0 ? lead : 0);
    const after = overscanRef.current + (direction > 0 ? lead : 0);
    const { offset } = model.current;
    if (index.count === 0) return { first: 0, last: -1, anchor: 0, shape };
    return {
      first: index.indexAt(Math.max(0, offset - before)),
      last: index.indexAt(Math.min(index.total(), offset + height + after)),
      anchor: anchorOf(shape, offset),
      shape,
    };
  };

  const shape = shapeOf(sizes);
  model.current.reshape(shape);
  const view = windowOf(sizes);
  // What the last commit placed: the scroll handler keeps `--tj-window-top` in line with it.
  const rendered = useRef(view);

  const element = useRef(null);
  const writeWindowTop = (el, anchor) => {
    if (!el) return;
    const { top, offset } = model.current;
    if (shapeOf().scale === 1) el.style.removeProperty('--tj-window-top');
    else el.style.setProperty('--tj-window-top', windowTop(top, offset, anchor));
  };

  // Re-renders only when other items come into the window or the anchor moves.
  const update = useCallback((remeasure = false) => {
    const el = element.current;
    if (!el) return;
    if (remeasure) viewport.current = { ...viewport.current, margin: measureMargin(el) };
    const now = performance.now();
    const before = model.current.offset;
    const current = viewport.current;
    const height = el.clientHeight || current.height;
    viewport.current = { ...current, height };
    const offset = model.current.follow(shapeOf(), el.scrollTop);
    const elapsed = Math.max(1, now - current.at);
    const moved = offset - before;
    const speed = moved === 0 ? current.speed : Math.abs(moved) / elapsed;
    viewport.current = {
      height,
      margin: viewport.current.margin,
      direction: moved === 0 ? current.direction : Math.sign(moved),
      speed: elapsed > SETTLE_MS ? 0 : current.speed * 0.5 + speed * 0.5,
      at: now,
    };
    const was = rendered.current;
    writeWindowTop(el, was.anchor);
    const next = windowOf(sizesRef.current);
    if (next.first !== was.first || next.last !== was.last || next.anchor !== was.anchor) rerender();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scrolling: `isScrolling` from the first scroll event until SETTLE_MS after the last. When it stops, a scaled list
  // gets its thumb back in line where needed (scrollModel's resync); the items stay where they are.
  const scrolling = useRef(false);
  const settle = useRef(null);
  const onScroll = useCallback(() => {
    if (!scrolling.current) {
      scrolling.current = true;
      rerender();
    }
    clearTimeout(settle.current);
    settle.current = setTimeout(() => {
      scrolling.current = false;
      viewport.current = { ...viewport.current, speed: 0, direction: 0 };
      const el = element.current;
      const top = el ? model.current.resync(shapeOf(), viewport.current.height) : null;
      if (top !== null) {
        el.scrollTop = top;
        writeWindowTop(el, rendered.current.anchor);
      }
      rerender();
    }, SETTLE_MS);
    update();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A press on the scroll element itself (its scrollbar; rows are its children) starts a drag; a scroll while it is
  // held, with no wheel turning, is the drag.
  const pressed = useRef(false);
  const lastWheel = useRef(0);
  const onWheel = useCallback(() => {
    lastWheel.current = performance.now();
    if (model.current.dragging) model.current.endDrag();
  }, []);
  const onPointerDown = useCallback((event) => {
    if (event.target !== element.current || (event.button ?? 0) !== 0 || event.pointerType === 'touch') return;
    pressed.current = true;
    if (performance.now() - lastWheel.current > WHEEL_RECENT_MS) model.current.beginDrag();
  }, []);
  const onPointerUp = useCallback(() => {
    if (!pressed.current) return;
    pressed.current = false;
    model.current.endDrag();
  }, []);

  // Measured heights. An item above the view that changes height moves the offset with it, so the items in view stay.
  const resizeObserver = useRef(null);
  const observed = useRef(new Set());
  const applySizes = useCallback((entries) => {
    const index = sizesRef.current;
    let changed = false;
    let above = 0;
    const { offset } = model.current;
    for (const [item, size] of entries) {
      const i = Number(item.dataset.index);
      if (!item.isConnected || !(i >= 0 && i < index.count) || !size) continue;
      remember(i, size);
      const itemTop = index.offsetOf(i);
      const delta = index.setSize(i, size);
      if (delta === 0) continue;
      changed = true;
      if (itemTop + size - delta <= offset) above += delta;
    }
    if (above) {
      const top = model.current.adjust(shapeOf(), above);
      if (top !== null && element.current) element.current.scrollTop = top;
    }
    if (changed) rerender();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const measureElement = useCallback(
    (item) => {
      if (!item || !measure || typeof ResizeObserver === 'undefined') return;
      if (!resizeObserver.current) {
        resizeObserver.current = new ResizeObserver((entries) =>
          applySizes(
            entries.map((entry) => [entry.target, entry.borderBoxSize?.[0]?.blockSize ?? entry.target.offsetHeight])
          )
        );
      }
      if (!observed.current.has(item)) {
        observed.current.add(item);
        resizeObserver.current.observe(item);
      }
    },
    [measure, applySizes]
  );

  const resizeItem = useCallback((i, size) => {
    if (!(i >= 0 && i < sizesRef.current.count)) return;
    remember(i, size);
    if (sizesRef.current.setSize(i, size) !== 0) rerender();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scrollToIndex = useCallback((i, { align = 'start' } = {}) => {
    const el = element.current;
    const index = sizesRef.current;
    if (!el || !(i >= 0 && i < index.count)) return;
    const { height } = viewport.current;
    const itemStart = index.offsetOf(i);
    const size = index.sizeAt(i);
    const { offset } = model.current;
    let target = itemStart;
    if (align === 'center') target = itemStart - (height - size) / 2;
    else if (align === 'end') target = itemStart - height + size;
    else if (align === 'auto') {
      if (itemStart >= offset && itemStart + size <= offset + height) return;
      target = itemStart < offset ? itemStart : itemStart - height + size;
    }
    el.scrollTop = model.current.scrollTo(shapeOf(), target, height);
    writeWindowTop(el, rendered.current.anchor);
    rerender();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The items of the window, and which of them mount now (see mountBudgetMs).
  const all = [];
  for (let i = view.first; i <= view.last; i++) {
    all.push({ index: i, key: getItemKey(i), start: sizes.offsetOf(i) - view.anchor });
  }
  const mounted = useRef(new Set());
  const costPerItem = useRef(0);
  const renderStart = useRef(0);
  const freshCount = useRef(0);
  let items = all;
  let pending = false;
  if (mountBudgetMs !== Infinity && mounted.current.size > 0 && costPerItem.current > 0) {
    const fresh = all.filter((item) => !mounted.current.has(item.key));
    const allowed = Math.max(1, Math.floor(mountBudgetMs / costPerItem.current));
    if (fresh.length > allowed) {
      const middle = model.current.offset - view.anchor + viewport.current.height / 2;
      const distance = (item) => Math.abs(item.start + sizes.sizeAt(item.index) / 2 - middle);
      const now = new Set(
        fresh
          .sort((a, b) => distance(a) - distance(b))
          .slice(0, allowed)
          .map((item) => item.key)
      );
      items = all.filter((item) => mounted.current.has(item.key) || now.has(item.key));
      pending = true;
    }
  }
  freshCount.current = items.reduce((n, item) => n + (mounted.current.has(item.key) ? 0 : 1), 0);
  renderStart.current = performance.now();

  // After each render: follow the scroll element (it mounts and unmounts with the items), line `--tj-window-top` up
  // with this render's anchor, learn what mounting costs, and stop observing items that left.
  const listen = (el, on) => {
    const method = on ? 'addEventListener' : 'removeEventListener';
    el[method]('scroll', onScroll, { passive: true });
    el[method]('wheel', onWheel, { passive: true });
    el[method]('pointerdown', onPointerDown, { passive: true });
  };
  const viewportObserver = useRef(null);
  useLayoutEffect(() => {
    if (freshCount.current > 0) {
      const cost = (performance.now() - renderStart.current) / freshCount.current;
      costPerItem.current = costPerItem.current ? costPerItem.current * 0.5 + cost * 0.5 : cost;
    }
    mounted.current = new Set(items.map((item) => item.key));
    rendered.current = view;
    const el = scrollRef.current ?? null;
    if (el !== element.current) {
      if (element.current) listen(element.current, false);
      viewportObserver.current?.disconnect();
      element.current = el;
      if (el) {
        listen(el, true);
        // The viewport's own height changes too (list resized, dynamic height).
        if (typeof ResizeObserver !== 'undefined') {
          viewportObserver.current = new ResizeObserver(() => update(true));
          viewportObserver.current.observe(el);
        }
        update(true);
      }
    }
    writeWindowTop(el, view.anchor);
    for (const item of observed.current) {
      if (!item.isConnected) {
        resizeObserver.current?.unobserve(item);
        observed.current.delete(item);
      }
    }
  });

  useEffect(() => {
    if (!pending) return undefined;
    const frame = requestAnimationFrame(rerender);
    return () => cancelAnimationFrame(frame);
  });

  useEffect(() => {
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    return () => {
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      if (element.current) listen(element.current, false);
      clearTimeout(settle.current);
      viewportObserver.current?.disconnect();
      resizeObserver.current?.disconnect();
      resizeObserver.current = null;
      observed.current.clear();
      element.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    items,
    height: shape.height,
    itemTop: (start) => itemTop(shape, start),
    sizeAt: (i) => sizes.sizeAt(i),
    measureElement: measure ? measureElement : noop,
    resizeItem,
    scrollToIndex,
    isScrolling: scrolling.current,
    pending,
    tick,
  };
}
