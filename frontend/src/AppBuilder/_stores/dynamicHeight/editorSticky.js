import { readRenderedSlot } from './engine';
import { solveContainer, swapsWithinColumns } from './solver';
import { heightContractOf } from './contracts';
import { isDynamicHeightLiveInEditor } from './flags';
import { getDynamicLayoutKey } from '../utils/dynamicHeightReflow';
import { GRID_HEIGHT } from '@/AppBuilder/AppCanvas/appCanvasConstants';

// ─────────────────────────────────────────────────────────────────────────────
// Editor POC: sticky visible positions (PDF Q4/Q5, Q11, Q23 to Q26, Q29, Q33).
//
// "Visible position is sticky; the saved value is visible minus whatever was
// pushing or pulling at the moment of commit." When the builder moves,
// resizes or deletes a widget, every sibling the builder did not touch keeps
// the position it had on screen, and its saved top is rewritten so the engine
// renders it there under the new layout.
//
// Runs synchronously on each saved-layout change, before the engine's next
// pass, so the rewrite lands before anything can move. Only grid slots on the
// current page are handled; rows and flex children are left to the engine.
// ─────────────────────────────────────────────────────────────────────────────

const MAX_ROUNDS = 6;

const pageComponents = (state, moduleId) => {
  const module = state.modules?.[moduleId];
  return module?.pages?.[module.currentPageIndex]?.components;
};

// Widgets whose saved layout, parent or existence changed in this update.
const touchedIds = (previous, next, layout) => {
  const touched = new Set();
  for (const id of new Set([...Object.keys(previous || {}), ...Object.keys(next || {})])) {
    const before = previous?.[id];
    const after = next?.[id];
    if (!before || !after) {
      touched.add(id);
      continue;
    }
    if (before.layouts?.[layout] !== after.layouts?.[layout] || before.component?.parent !== after.component?.parent) {
      touched.add(id);
    }
  }
  return touched;
};

// Grid slots on the page: the root plus every grid container's content slot
// (as named by its children's `parent`).
const gridSlots = (state, components) => {
  const slots = new Set([null]);
  for (const component of Object.values(components)) {
    const slotId = component?.component?.parent;
    if (!slotId) continue;
    const owner = components[state.getBaseParentId(slotId)];
    const contract = heightContractOf(owner?.component?.component);
    if (contract?.content === 'grid') slots.add(slotId);
  }
  return [...slots];
};

// For one slot: the saved tops that keep every untouched widget at the top it
// had on screen before this update.
const stickyRewritesForSlot = ({ state, previousComponents, moduleId, slotId, touched, layout }) => {
  const { siblings, flowOf } = readRenderedSlot(state, { moduleId, slotId });
  if (siblings.length === 0) return {};
  const temps = state.temporaryLayouts || {};
  const renderedBefore = (id) =>
    temps[getDynamicLayoutKey(id, null, '', moduleId)]?.top ?? previousComponents?.[id]?.layouts?.[layout]?.top;

  // The engine snaps rendered tops to the grid in the editor (PDF Q6), so the
  // comparison snaps the same way; otherwise every widget looks a few pixels
  // off and gets rewritten on every change.
  const snap = (top) => Math.round(top / GRID_HEIGHT) * GRID_HEIGHT;
  const boxes = siblings.map((box) => ({ ...box }));

  // A change that swaps two untouched widgets in the same column (a widget
  // moved onto another's exact saved spot flips which is drawn first) cannot
  // be kept still by adjusting saved tops: every correction swaps them again.
  // Let the engine settle instead. Widgets in other columns don't count.
  {
    const { tops } = solveContainer(boxes, flowOf);
    const untouched = boxes.filter(
      (box) => !touched.has(box.id) && renderedBefore(box.id) !== undefined && tops.has(box.id)
    );
    const reordered = swapsWithinColumns(untouched, renderedBefore, (id) => tops.get(id));
    if (reordered) {
      if (typeof window !== 'undefined')
        (window.__tjStickyLog ||= []).push({ touched: [...touched], skipped: 'solve order changed', slotId });
      return {};
    }
  }

  for (let round = 0; round < MAX_ROUNDS; round++) {
    const { tops } = solveContainer(boxes, flowOf);
    let changed = false;
    for (const box of boxes) {
      if (touched.has(box.id)) continue;
      const want = renderedBefore(box.id);
      const got = tops.has(box.id) ? snap(tops.get(box.id)) : undefined;
      if (want === undefined || got === undefined || snap(want) === got) continue;
      box.top = Math.max(0, box.top + (snap(want) - got));
      changed = true;
    }
    if (!changed) break;
  }

  const rewrites = {};
  const components = pageComponents(state, moduleId);
  for (const box of boxes) {
    const saved = components[box.id]?.layouts?.[layout];
    if (!saved || saved.top === box.top) continue;
    rewrites[box.id] = { ...saved, top: box.top };
  }
  return rewrites;
};

let applying = false;

// Editor POC: dry run for a demo or a script. Returns, per slot, the solve
// rounds and the rewrites the watcher would apply if `touched` had changed.
export const stickyDryRun = (state, touched, moduleId = 'canvas') => {
  const next = pageComponents(state, moduleId);
  const layout = state.currentLayout;
  const out = {};
  for (const slotId of gridSlots(state, next)) {
    out[slotId ?? 'root'] = stickyRewritesForSlot({
      state,
      previousComponents: next,
      moduleId,
      slotId,
      touched: new Set(touched),
      layout,
    });
  }
  return out;
};

export const watchStickySiblings = (get) => (state, previous) => {
  if (!isDynamicHeightLiveInEditor() || applying) return;
  if (state.modules === previous.modules) return;
  const layout = state.currentLayout;
  for (const moduleId of Object.keys(state.modules || {})) {
    if (state.modeStore?.modules?.[moduleId]?.currentMode !== 'edit') continue;
    const next = pageComponents(state, moduleId);
    const before = pageComponents(previous, moduleId);
    if (!next || !before || next === before) continue;
    // Page switch: a different page, nothing to keep still.
    if (state.modules[moduleId]?.currentPageIndex !== previous.modules?.[moduleId]?.currentPageIndex) continue;
    const touched = touchedIds(before, next, layout);
    if (touched.size === 0) continue;

    const rewrites = {};
    for (const slotId of gridSlots(state, next)) {
      Object.assign(
        rewrites,
        stickyRewritesForSlot({ state, previousComponents: before, moduleId, slotId, touched, layout })
      );
    }
    if (Object.keys(rewrites).length === 0) continue;
    if (typeof window !== 'undefined') (window.__tjStickyLog ||= []).push({ touched: [...touched], rewrites });

    applying = true;
    try {
      // Silent, as the PDF asks: no undo entry for widgets the builder did not touch.
      get().setComponentLayout(rewrites, undefined, moduleId, { skipUndoRedo: true });
    } finally {
      applying = false;
    }
  }
};
