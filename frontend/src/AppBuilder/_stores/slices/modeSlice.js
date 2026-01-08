const initialState = {
  modeStore: {
    modules: {
      canvas: {
        currentMode: 'view',
      },
    },
  },
  isPreviewInEditor: false,
  previewPhase: 'idle', // previewPhase tracks the current stage of the preview transition: 'idle' | 'closing-panels' | 'switching-mode' | 'animating' | 'mounting-sidebars'
  targetMode: 'edit', // targetMode indicates which mode we are transitioning into: 'edit | 'view'
  transitionCounter: 4, // tracks how many animated elements are left to complete. Currently counts 4: left, right, query, canvas. Update if needed.
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
    /**
     * Toggles editor mode (edit ↔ view).
     * The actual mode switch is deferred and driven by `previewPhase`
     * to ensure panels are mounted/unmounted with proper transitions.
     */
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
        /**
         * Called by each animated element when its CSS transition finishes.
         * Decrements (or increments) transitionCounter based on direction.
         * Be cautious: if one element never fires transitionend,
         * counter will never reach 0 and the transition will never settle.
         */
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
