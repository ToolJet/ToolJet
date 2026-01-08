const initialState = {
  modeStore: {
    modules: {
      canvas: {
        currentMode: 'view',
      },
    },
  },
  isPreviewInEditor: false,
  previewPhase: 'idle', // 'idle' | 'closing-panels' | 'switching-mode' | 'animating' | 'mounting-sidebars'
  targetMode: 'edit', // 'edit | 'view'
  transitionCounter: 4,
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
  setIsPreviewInEditor: (value) =>
    set(
      (state) => {
        state.isPreviewInEditor = value;
      },
      false,
      'setIsPreviewInEditor'
    ),
  setTargetMode: (mode) =>
    set(
      (state) => {
        if (mode === 'edit' || mode === 'view') state.targetMode = mode;
      },
      false,
      'setTargetMode'
    ),
  setPreviewPhase: (phase) =>
    set(
      (state) => {
        const validPhases = ['idle', 'closing-panels', 'switching-mode', 'animating', 'mounting-sidebars'];
        if (validPhases.includes(phase)) state.previewPhase = phase;
      },
      false,
      'setPreviewPhase'
    ),
  toggleCurrentMode: (moduleId = 'canvas') => {
    const { getCurrentMode, setTargetMode, setPreviewPhase } = get();

    const targetMode = getCurrentMode(moduleId) === 'edit' ? 'view' : 'edit';
    setTargetMode(targetMode);

    if (targetMode === 'view') {
      setPreviewPhase('closing-panels');
    } else setPreviewPhase('mounting-sidebars');
  },
  notifyTransitionDone: () =>
    set(
      (state) => {
        if (state.targetMode === 'view') {
          state.transitionCounter -= 1;
        } else {
          state.transitionCounter += 1;
        }
      },
      false,
      'notifyTransitionDone'
    ),
});
