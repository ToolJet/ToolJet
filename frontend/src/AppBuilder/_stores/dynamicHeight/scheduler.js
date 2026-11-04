import { flushDynamicHeight } from './engine';

// Collects height changes from widgets, the height registry and saved-layout
// edits, and runs the engine once per animation frame.
const pendingRequests = new Map();
const pendingHeights = new Map();
const pendingFullModules = new Set();
let frame = null;
let storeGet = null;

const flush = () => {
  frame = null;
  const requests = [...pendingRequests.values()];
  const measuredHeights = new Map(pendingHeights);
  const fullModules = [...pendingFullModules];
  pendingRequests.clear();
  pendingHeights.clear();
  pendingFullModules.clear();
  flushDynamicHeight(storeGet, { requests, measuredHeights, fullModules });
};

const requestFlush = (get) => {
  storeGet = get;
  if (frame === null) frame = requestAnimationFrame(flush);
};

const requestKey = ({ id, layout, isContainer, contextIndices, moduleId }) =>
  `${id}|${layout}|${isContainer ? 1 : 0}|${contextIndices ? contextIndices.join('.') : ''}|${moduleId}`;

export const scheduleDynamicHeight = (get, request) => {
  const normalized = { ...request, moduleId: request.moduleId || 'canvas' };
  pendingRequests.set(requestKey(normalized), normalized);
  requestFlush(get);
};

// `entries`: [{ key, id, contextIndices, moduleId, layout, height }] from the
// height registry; the height is used as-is instead of reading the DOM.
export const scheduleMeasuredHeights = (get, entries) => {
  for (const entry of entries) {
    pendingHeights.set(entry.key, entry.height);
    scheduleDynamicHeight(get, { ...entry, isContainer: false });
  }
};

export const scheduleFullSolve = (get, moduleId) => {
  pendingFullModules.add(moduleId);
  requestFlush(get);
};

const pageComponents = (state, moduleId) => {
  const module = state.modules?.[moduleId];
  return module?.pages?.[module.currentPageIndex]?.components;
};

// Saved layouts changed (a widget moved, added, deleted, a page switched): the
// solver keeps no history, so the affected module is simply solved again.
export const watchSavedLayouts = (get) => (state, previous) => {
  if (state.modules === previous.modules && state.currentLayout === previous.currentLayout) return;
  for (const moduleId of Object.keys(state.modules || {})) {
    const changed =
      state.currentLayout !== previous.currentLayout ||
      pageComponents(state, moduleId) !== pageComponents(previous, moduleId);
    if (changed) scheduleFullSolve(get, moduleId);
  }
};
