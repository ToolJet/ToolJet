import useStore from '@/AppBuilder/_stores/store';
import { isDynamicHeightLiveInEditor, isDynamicHeightV2Enabled } from '@/AppBuilder/_stores/dynamicHeight/flags';
import { scheduleFullSolve } from '@/AppBuilder/_stores/dynamicHeight/scheduler';

// Preview inside the editor: the canvas switches to view mode in place and
// fills the screen under the editor header. The editor's panels, Grid
// (Moveable) and Selecto stay mounted, hidden and inert, so going back to edit
// re-renders them instead of rebuilding them.

// On by default; `localStorage['tj-in-editor-preview'] = 'off'` turns it off.
// Not in the module editor, and not with the live-in-editor dynamic height
// POC, which already runs the engine on the edit canvas.
export const isInEditorPreviewEnabled = (isModuleEditor) => {
  if (isModuleEditor || isDynamicHeightLiveInEditor()) return false;
  try {
    return window.localStorage.getItem('tj-in-editor-preview') !== 'off';
  } catch {
    return true;
  }
};

// Read with the mode, so anything that puts the canvas back in edit mode (an
// app or version load) also ends the preview.
export const selectInEditorPreview = (state) =>
  !!state.isPreviewInEditor && state.modeStore.modules.canvas?.currentMode === 'view';

// The canvas height follows the mode (the editor reserves room below the
// widgets), so it is set in the same render as the mode.
const updateCanvasHeight = (moduleId) => {
  const state = useStore.getState();
  state.updateCanvasBottomHeight(state.getCurrentPageComponents(moduleId), moduleId);
};

export const enterInEditorPreview = (moduleId = 'canvas') => {
  const state = useStore.getState();
  state.clearSelectedComponents();
  state.setPreviewInEditor(true, moduleId);
  updateCanvasHeight(moduleId);
  if (isDynamicHeightV2Enabled()) scheduleFullSolve(useStore.getState, moduleId);
};

export const exitInEditorPreview = (moduleId = 'canvas') => {
  const state = useStore.getState();
  // The editor draws saved layouts; drop the positions the preview rendered.
  state.clearTemporaryLayouts();
  state.setPreviewInEditor(false, moduleId);
  updateCanvasHeight(moduleId);
};
