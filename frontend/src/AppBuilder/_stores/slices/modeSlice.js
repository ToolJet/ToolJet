const initialState = {
  modeStore: {
    modules: {
      canvas: {
        currentMode: 'view',
      },
    },
  },
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
  toggleCurrentMode: (moduleId = 'canvas') =>
    set(
      (state) => {
        const currentMode = state.modeStore.modules[moduleId].currentMode;
        state.modeStore.modules[moduleId].currentMode = currentMode === 'edit' ? 'view' : 'edit';
        state.isPreviewInEditor = currentMode === 'edit' ? true : false;
      },
      false,
      'toggleCurrentMode'
    ),
  getCurrentMode: (moduleId) => get().modeStore.modules[moduleId].currentMode,
});
