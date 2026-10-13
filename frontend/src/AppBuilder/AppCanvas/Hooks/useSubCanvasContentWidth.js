import { useLayoutEffect, useState } from 'react';
import { unstable_batchedUpdates } from 'react-dom';
import { contentWidthFromResizeEntry, getLayoutContentWidth, keepWidthIfUnchanged } from '../canvasGeometry';

// Resizes this close together are one continuous resize (a container's handle being dragged): only the width it
// settles at is committed, so the children are not re-laid-out on every frame.
const RESIZE_SETTLE_MS = 100;

// One observer for every sub-canvas on the page; a ListView or Form can render dozens of them.
let observer = null;
const listeners = new Map(); // element → Set of width callbacks
const pendingWidths = new Map(); // element → latest observed content width
const shownWidths = new WeakMap(); // element → last width delivered (0 while hidden)
let frame = 0; // a resize after a quiet period is committed on the next frame
let settleTimer = 0; // later resizes of the same burst wait until it settles
let quietTimer = 0; // running while a resize just committed may still be continuing

// The app mounts with the legacy ReactDOM.render root, which does not batch updates made outside React events:
// unbatched, each of N ListView rows re-rendered synchronously, N commits per observer delivery.
const deliver = (updates) =>
  unstable_batchedUpdates(() =>
    updates.forEach(([element, width]) => {
      shownWidths.set(element, width);
      listeners.get(element)?.forEach((onWidth) => onWidth(width));
    })
  );

const flush = () => {
  frame = 0;
  settleTimer = 0;
  const updates = [...pendingWidths];
  pendingWidths.clear();
  deliver(updates);
  clearTimeout(quietTimer);
  quietTimer = setTimeout(() => {
    quietTimer = 0;
  }, RESIZE_SETTLE_MS);
};

const onResize = (entries) => {
  // A canvas that was hidden (a tab switched to, a modal opened) and now shows gets its width at once: observers
  // run after layout and before paint, so its components are laid out on its real grid in the first frame they
  // appear. Only resizes of a canvas already showing wait for a frame or for a continuous resize to settle.
  const shown = [];
  entries.forEach((entry) => {
    const width = contentWidthFromResizeEntry(entry);
    if (width > 0 && !(shownWidths.get(entry.target) > 0)) {
      pendingWidths.delete(entry.target);
      shown.push([entry.target, width]);
    } else {
      pendingWidths.set(entry.target, width);
    }
  });
  if (shown.length) deliver(shown);
  if (!pendingWidths.size || frame) return;
  if (quietTimer || settleTimer) {
    clearTimeout(settleTimer);
    settleTimer = setTimeout(flush, RESIZE_SETTLE_MS);
    return;
  }
  frame = requestAnimationFrame(flush);
};

const observe = (element, onWidth) => {
  if (typeof ResizeObserver === 'undefined') return () => {};
  if (!observer) observer = new ResizeObserver(onResize);
  let callbacks = listeners.get(element);
  if (!callbacks) {
    callbacks = new Set();
    listeners.set(element, callbacks);
    observer.observe(element);
  }
  callbacks.add(onWidth);
  return () => {
    callbacks.delete(onWidth);
    if (callbacks.size) return;
    listeners.delete(element);
    pendingWidths.delete(element);
    observer?.unobserve(element);
  };
};

/**
 * The rendered content width of a sub-canvas (`.real-canvas`): the width its NO_OF_GRIDS columns must span.
 * Undefined while disabled or before the element exists, so callers can fall back to an estimate.
 *
 * Sub-canvases used to derive this from per-widget padding arithmetic (getSubContainerWidthAfterPadding), which
 * drifted from the rendered box for ListView, Kanban, full-screen modals, FlexContainer and others, leaving an
 * uneven strip or clipping on the right. Measuring the box the children are actually laid out in removes that.
 */
export function useSubCanvasContentWidth(canvasRef, enabled = true) {
  const [width, setWidth] = useState(undefined);

  useLayoutEffect(() => {
    const element = canvasRef.current;
    if (!enabled || !element) {
      setWidth(undefined);
      return undefined;
    }
    const update = (next) => {
      if (next > 0) setWidth(keepWidthIfUnchanged(next));
    };
    const initial = getLayoutContentWidth(element); // exact, before paint; the observer follows later changes
    if (initial > 0) shownWidths.set(element, initial);
    update(initial);
    return observe(element, update);
  }, [canvasRef, enabled]);

  return width;
}
