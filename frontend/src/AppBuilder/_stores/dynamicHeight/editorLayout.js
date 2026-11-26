import useStore from '@/AppBuilder/_stores/store';
import { getDynamicLayoutKey } from '../utils/dynamicHeightReflow';
import { isDynamicHeightEditorPocEnabled, isDynamicHeightLiveInEditor } from './flags';
import { stickyDryRun } from './editorSticky';
import { readRenderedSlot } from './engine';
import { savedTopForVisibleTop } from './solver';

// ─────────────────────────────────────────────────────────────────────────────
// Editor helpers for live dynamic height. The editor shows rendered positions,
// but only saved positions are stored, so every commit converts back.
// ─────────────────────────────────────────────────────────────────────────────

// Content-sized widgets carry this class in the editor (styling hook only).
export const CONTENT_SIZED_CLASS = 'dh-content-sized';

// Saved top for a widget dropped, pasted or added where the builder sees it.
// `slotId` is the target container slot (null for the main canvas); the
// widgets being moved are left out of the blockers.
export const toSavedTop = ({
  visibleTop,
  slotId = null,
  left,
  width,
  height,
  moduleId = 'canvas',
  excludeIds = [],
}) => {
  if (!isDynamicHeightLiveInEditor()) return visibleTop;
  const { siblings, tops, flowOf } = readRenderedSlot(useStore.getState(), { moduleId, slotId, excludeIds });
  if (siblings.length === 0) return visibleTop;
  return savedTopForVisibleTop({ visibleTop, left, width, height, siblings, tops, flowOf });
};

// How far a widget currently renders below (or above) its saved top.
export const getRenderedTopOffset = (id, savedTop, moduleId = 'canvas') => {
  if (!isDynamicHeightLiveInEditor()) return 0;
  const renderedTop = useStore.getState().temporaryLayouts?.[getDynamicLayoutKey(id, null, '', moduleId)]?.top;
  return renderedTop === undefined ? 0 : renderedTop - savedTop;
};

// PDF Q2/Q3, Q21, Q27, Q30: when a content-sized widget is moved, pasted or
// group-moved, its current rendered height becomes its saved height.
export const getRenderedHeight = (id, savedHeight, moduleId = 'canvas') => {
  if (!isDynamicHeightLiveInEditor()) return savedHeight;
  const state = useStore.getState();
  const resolved = state.getResolvedComponent(id, null, moduleId);
  if (!resolved?.properties?.dynamicHeight) return savedHeight;
  const rendered = state.temporaryLayouts?.[getDynamicLayoutKey(id, null, '', moduleId)]?.height;
  return rendered > 0 ? rendered : savedHeight;
};

// Editor POC: lets a demo or a script commit a drop the way the grid does.
if (isDynamicHeightEditorPocEnabled() && typeof window !== 'undefined') {
  window.__tjDhEditor = { toSavedTop, getRenderedTopOffset, getRenderedHeight, stickyDryRun };
}
