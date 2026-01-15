const initialState = {
  modeStore: {
    modules: {
      canvas: {
        currentMode: 'view',
      },
    },
  },
  isPreviewInEditor: false,
  previewPhase: 'idle', // previewPhase tracks the current stage of the preview transition: 'idle' | 'closing-panels' | 'switching-mode' | 'animating' | 'mounting-sidebars' | 'unmounting-sidebars' | 'restoring-panels'
  targetMode: 'edit', // targetMode indicates which mode we are transitioning into: 'edit | 'view'
  settledAnimatedComponents: [], // tracks which components are done animating. Currently stores: left, right, query, canvas. Update if needed.
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
        const validPhases = [
          'idle',
          'closing-panels',
          'switching-mode',
          'animating',
          'mounting-sidebars',
          'unmounting-sidebars',
          'restoring-panels',
        ];
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
  notifyTransitionDone: (component) =>
    set(
      (state) => {
        /**
         * Called by each animated element when its CSS transition finishes.
         * Stores components that are done animating in an array.
         * Be cautious: if one element out of the required ones never fires transitionend, the transition will never settle.
         */
        if (!state.settledAnimatedComponents.includes(component)) {
          state.settledAnimatedComponents.push(component);
        }
      },
      false,
      'notifyTransitionDone'
    ),
  resetSettledAnimatedComponents: () =>
    set(
      (state) => {
        state.settledAnimatedComponents = [];
      },
      false,
      'resetSettledAnimatedComponents'
    ),
});
