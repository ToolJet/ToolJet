import { flushDynamicHeight } from './engine';
import { createHeightRegistry } from './heightRegistry';
import { getDynamicElementSelector, getDynamicLayoutKey } from './layoutKeys';

// ─────────────────────────────────────────────────────────────────────────────
// Dynamic height scheduler: decides when the engine runs.
//
// Height changes arrive all the time and from three places:
//
//   - the height registry: heights the browser measured (scheduleMeasuredHeights)
//   - widgets: "my height may have changed" without a height, e.g. after a
//     visibility or property change (scheduleDynamicHeight)
//   - saved-layout edits: a widget moved, added or deleted, a page or layout
//     switched (watchSavedLayouts → scheduleFullSolve)
//
// They are collected and handed to the engine together, once per browser
// frame, so a burst of changes costs one pass and one store write.
//
// One scheduler per store. It owns the app's height registry, so widgets are
// observed through it (`observe`, `unobserve`, `setFrozen`).
// ─────────────────────────────────────────────────────────────────────────────

// A widget that just started being observed has not reported its size yet. A
// pass waits for it this many frames at most, so a container that just mounted
// is sized once from its children's real heights instead of from their saved
// ones and again a frame later. A widget that never reports (its element was
// never drawn) is then forgotten, so it cannot delay every later pass.
const MAX_MEASUREMENT_WAIT_FRAMES = 3;

/**
 * A FlexContainer's drawn width, read from its box on the canvas (WidgetWrapper's element, matched by widget, row
 * and module). `clientWidth` is padding included, border excluded, as the engine expects. A box that is not drawn,
 * or drawn 0 wide (inside a hidden tab, say), has no width yet: null, and the engine lays it out on one line.
 */
export const readWrapperWidth = (id, contextIndices, moduleId) =>
  document.querySelector(getDynamicElementSelector(id, contextIndices, moduleId))?.clientWidth || null;

const isEmpty = (object) => {
  for (const _ in object) return false;
  return true;
};

// The components of the page a module shows, read from a store snapshot (the store's own getter reads the live
// state, so it cannot look at the previous one).
const shownPageComponents = (state, moduleId) => {
  const module = state.modules?.[moduleId];
  return module?.pages?.find((page) => page.id === module.currentPageId)?.components;
};

/**
 * @param {object} options
 * @param {() => object} options.getState  the App Builder store's getState
 * @param {(callback: () => void) => unknown} [options.requestFrame]  the browser's requestAnimationFrame by default
 * @param {typeof ResizeObserver} [options.ResizeObserver]  passed to the height registry; the browser's by default
 * @param {(id: string, contextIndices: Array<number>|null, moduleId: string) => number|null} [options.measureWidth]
 *   a FlexContainer's drawn width; `readWrapperWidth` by default
 */
export const createDynamicHeightScheduler = (options) => {
  const {
    getState,
    requestFrame = (callback) => requestAnimationFrame(callback),
    measureWidth = readWrapperWidth,
  } = options;

  const pendingChanges = new Map(); // layout key → { id, contextIndices, moduleId, height? }
  const pendingModules = new Set(); // modules to solve whole
  let framePending = false;
  let waitedFrames = 0;

  // Modules whose pass failed (production only) and were already solved again once. A module leaves this set after
  // a pass in which it did not fail, so a fault that persists costs one retry per change, not one pass per frame.
  const retriedModules = new Set();

  const requestFlush = () => {
    if (framePending) return;
    framePending = true;
    requestFrame(onFrame);
  };

  /**
   * Asks for a widget to be sized again on the next frame: with `height` when the browser measured it. Asked about
   * twice in one frame, it is solved once, with the latest height known.
   *
   * @param {{id: string, contextIndices?: Array<number>|null, moduleId?: string, height?: number}} change
   */
  const scheduleDynamicHeight = ({ id, contextIndices = null, moduleId = 'canvas', height }) => {
    const key = getDynamicLayoutKey(id, contextIndices, '', moduleId);
    const latestHeight = height ?? pendingChanges.get(key)?.height;
    pendingChanges.set(key, { id, contextIndices, moduleId, height: latestHeight });
    requestFlush();
  };

  // The registry's report: heights measured this frame (each entry also carries its key and what the widget
  // registered with, which the engine does not need).
  const scheduleMeasuredHeights = (entries) => {
    for (const entry of entries) scheduleDynamicHeight(entry);
  };

  // Every canvas of the module is placed again on the next frame (its saved layout changed).
  const scheduleFullSolve = (moduleId) => {
    pendingModules.add(moduleId);
    requestFlush();
  };

  const registry = createHeightRegistry({
    report: scheduleMeasuredHeights,
    ...('ResizeObserver' in options && { ResizeObserver: options.ResizeObserver }),
  });

  // A module placed whole is placed at the heights last measured in it, not only at those its rendered layouts
  // remember: those may have been cleared (a layout or page switch does), and the browser reports a height only when
  // it changes. A widget already pending keeps the height it came with, if any, as it is at least as new.
  const addMeasuredHeights = () => {
    for (const { id, contextIndices = null, moduleId = 'canvas', height } of registry.measuredHeights()) {
      if (!pendingModules.has(moduleId)) continue;
      const key = getDynamicLayoutKey(id, contextIndices, '', moduleId);
      const pendingHeight = pendingChanges.get(key)?.height;
      pendingChanges.set(key, { id, contextIndices, moduleId, height: pendingHeight ?? height });
    }
  };

  /**
   * Runs one pass now with everything pending. The frame calls this; so can a caller that needs the layout written
   * before the browser paints.
   */
  const flush = () => {
    if (pendingChanges.size === 0 && pendingModules.size === 0) return;
    if (pendingModules.size > 0) addMeasuredHeights();
    // Taken before the pass runs: a pass that throws (outside production) must not leave them to be run again, and
    // whatever the pass schedules (a retry) goes to the next frame.
    const changes = [...pendingChanges.values()];
    const fullModules = [...pendingModules];
    pendingChanges.clear();
    pendingModules.clear();

    const failed = new Set();
    const onError = (moduleId) => {
      failed.add(moduleId);
      if (retriedModules.has(moduleId)) return;
      retriedModules.add(moduleId);
      scheduleFullSolve(moduleId);
    };
    flushDynamicHeight(getState, { changes, fullModules, measureWidth, onError });
    for (const moduleId of retriedModules) if (!failed.has(moduleId)) retriedModules.delete(moduleId);
  };

  // The frame: waits for widgets that have not reported their first size yet, then runs the pass.
  const onFrame = () => {
    framePending = false;
    if (registry.isAwaitingMeasurement() && waitedFrames < MAX_MEASUREMENT_WAIT_FRAMES) {
      waitedFrames += 1;
      requestFlush();
      return;
    }
    registry.forgetAwaitedMeasurements();
    waitedFrames = 0;
    flush();
  };

  /**
   * A store listener (`useStore.subscribe(watchSavedLayouts)`): when a module's saved layout changes, it is solved
   * again whole. The engine keeps no positions between passes, so solving again from the saved layouts is all a
   * move, an add, a delete, a page switch or a layout switch needs.
   *
   * Every module is solved again when the layout switches, or when the rendered layouts are cleared (the store does
   * on a layout or page switch, and after changing which components show on mobile).
   *
   * Runs on every store update, so it does no more than a few comparisons unless one of those changed. A property
   * edit also gives a module new components, and it can change heights too (Row height, Dynamic height itself).
   */
  const watchSavedLayouts = (state, previous) => {
    const layoutSwitched = state.currentLayout !== previous.currentLayout;
    const renderedLayoutsCleared =
      state.temporaryLayouts !== previous.temporaryLayouts &&
      isEmpty(state.temporaryLayouts) &&
      !isEmpty(previous.temporaryLayouts);
    if (!layoutSwitched && !renderedLayoutsCleared && state.modules === previous.modules) return;

    for (const moduleId of Object.keys(state.modules ?? {})) {
      const savedLayoutChanged = shownPageComponents(state, moduleId) !== shownPageComponents(previous, moduleId);
      if (layoutSwitched || renderedLayoutsCleared || savedLayoutChanged) scheduleFullSolve(moduleId);
    }
  };

  return {
    scheduleDynamicHeight,
    scheduleMeasuredHeights,
    scheduleFullSolve,
    flush,
    watchSavedLayouts,
    observe: registry.observe,
    unobserve: registry.unobserve,
    setFrozen: registry.setFrozen,
  };
};
