import { flushDynamicHeight } from './engine';
import { isDynamicHeightLiveInEditor, isDynamicHeightV2Enabled } from './flags';
import { GRID_HEIGHT } from '@/AppBuilder/AppCanvas/appCanvasConstants';

// Collects height changes from widgets, the height registry and saved-layout
// edits, and runs the engine once per animation frame.
const pendingRequests = new Map();
const pendingHeights = new Map();
const pendingFullModules = new Set();
let frame = null;
let storeGet = null;

// Widgets the height registry has started observing but that have not reported
// a size yet. A pass waits for them (a few frames at most), so a container
// that just mounted is sized once from real heights instead of from defaults
// and again a frame later.
const awaitingMeasurement = new Set();
const MAX_MEASUREMENT_WAIT_FRAMES = 3;
let waitedFrames = 0;

export const expectMeasurement = (key) => awaitingMeasurement.add(key);
export const measurementArrived = (key) => awaitingMeasurement.delete(key);

// Modules whose last pass failed in production and were already solved again
// once. A module leaves the set when a pass completes without failing, so a
// persistent fault costs one retry per natural request, not one per frame.
const retriedModules = new Set();

// Editor POC (PDF Q58): height updates wait while a widget is dragged or
// resized, so nothing moves under the pointer; everything collected meanwhile
// is applied on release.
const isLayoutGestureActive = (state) =>
  !!(state.draggingComponentId || state.resizingComponentId || state.isGroupDragging || state.isGroupResizing);

// Editor POC: modules in edit mode get snapped tops and the selection revealed.
const editorOptions = (state) => {
  if (!isDynamicHeightLiveInEditor()) return undefined;
  const modules = new Set(
    Object.entries(state.modeStore?.modules || {})
      .filter(([, module]) => module?.currentMode === 'edit')
      .map(([moduleId]) => moduleId)
  );
  if (modules.size === 0) return undefined;
  return { modules, snapStep: GRID_HEIGHT, revealedIds: new Set(state.selectedComponents || []) };
};

const flush = () => {
  if (isDynamicHeightLiveInEditor() && isLayoutGestureActive(storeGet())) {
    frame = requestAnimationFrame(flush);
    return;
  }
  if (awaitingMeasurement.size > 0 && waitedFrames < MAX_MEASUREMENT_WAIT_FRAMES) {
    waitedFrames += 1;
    frame = requestAnimationFrame(flush);
    return;
  }
  // Whatever still has not reported is not going to (its element never got a
  // size); forgetting it keeps one lost widget from delaying every later pass.
  awaitingMeasurement.clear();
  waitedFrames = 0;
  frame = null;
  // Without the editor POC the edit canvas shows saved layouts, so only
  // modules in view mode (the viewer, a preview in the editor) are solved.
  // Requests from an edit canvas, or still queued when a preview ends, are dropped.
  const state = storeGet();
  const solved = (moduleId) =>
    isDynamicHeightLiveInEditor() || state.modeStore?.modules?.[moduleId]?.currentMode === 'view';
  const requests = [...pendingRequests.values()].filter((request) => solved(request.moduleId));
  const measuredHeights = new Map(pendingHeights);
  const fullModules = [...pendingFullModules].filter(solved);
  pendingRequests.clear();
  pendingHeights.clear();
  pendingFullModules.clear();

  const failed = new Set();
  const onError = (moduleId) => {
    failed.add(moduleId);
    if (retriedModules.has(moduleId)) return;
    retriedModules.add(moduleId);
    scheduleFullSolve(storeGet, moduleId);
  };
  flushDynamicHeight(storeGet, {
    requests,
    measuredHeights,
    fullModules,
    onError,
    editor: editorOptions(state),
  });
  for (const moduleId of retriedModules) if (!failed.has(moduleId)) retriedModules.delete(moduleId);
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
  if (!isDynamicHeightV2Enabled()) return;
  if (state.modules === previous.modules && state.currentLayout === previous.currentLayout) return;
  for (const moduleId of Object.keys(state.modules || {})) {
    const changed =
      state.currentLayout !== previous.currentLayout ||
      pageComponents(state, moduleId) !== pageComponents(previous, moduleId);
    if (changed) scheduleFullSolve(get, moduleId);
  }
};

// The editor draws saved layouts. A page starts loading in view mode, so the
// engine may already have positioned widgets by the time the editor switches
// the canvas to edit: drop those positions, and solve again the embedded
// modules that stay in view mode.
export const watchEditMode = (get) => (state, previous) => {
  if (!isDynamicHeightV2Enabled() || isDynamicHeightLiveInEditor()) return;
  const mode = (s) => s.modeStore?.modules?.canvas?.currentMode;
  if (mode(state) !== 'edit' || mode(previous) === 'edit') return;
  if (Object.keys(get().temporaryLayouts || {}).length === 0) return;
  get().clearTemporaryLayouts();
  for (const [moduleId, module] of Object.entries(state.modeStore.modules)) {
    if (moduleId !== 'canvas' && module?.currentMode === 'view') scheduleFullSolve(get, moduleId);
  }
};

// Editor POC (PDF Q51): selecting or deselecting a collapsed hidden widget
// changes how it is laid out, so the canvas is solved again.
export const watchSelection = (get) => (state, previous) => {
  if (!isDynamicHeightLiveInEditor()) return;
  if (state.selectedComponents === previous.selectedComponents) return;
  const changed = [...(state.selectedComponents || []), ...(previous.selectedComponents || [])];
  if (changed.length === 0) return;
  scheduleFullSolve(get, 'canvas');
};
