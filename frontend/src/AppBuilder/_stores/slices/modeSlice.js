const initialState = {
  modeStore: {
    modules: {
      canvas: {
        currentMode: 'view',
      },
    },
  },
  // The editor is previewing its canvas in place (view mode, full screen under
  // the editor header). Set only by `_helpers/inEditorPreview.js`.
  isPreviewInEditor: false,
};

export const createModeSlice = (set, get) => ({
  ...initialState,
  initializeModeSlice: (moduleId) => {
    set(
      (state) => {
        state.modeStore.modules[moduleId] = {
          ...initialState.modeStore.modules.canvas,
        };
      },
      false,
      'initializeModeSlice'
    );
  },
  setCurrentMode: (currentMode, moduleId = 'canvas') =>
    set(
      (state) => {
        state.modeStore.modules[moduleId].currentMode = currentMode;
      },
      false,
      'setCurrentMode'
    ),
  getCurrentMode: (moduleId) => get().modeStore.modules[moduleId].currentMode,
  // One write for the flag and the mode, so nothing renders one without the other.
  setPreviewInEditor: (isPreview, moduleId = 'canvas') =>
    set(
      (state) => {
        state.isPreviewInEditor = isPreview;
        state.modeStore.modules[moduleId].currentMode = isPreview ? 'view' : 'edit';
      },
      false,
      'setPreviewInEditor'
    ),
});
