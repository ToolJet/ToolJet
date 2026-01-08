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
  setIsPreviewInEditor: (value) =>
    set(
      (state) => {
        state.isPreviewInEditor = value;
      },
      false,
      'setIsPreviewInEditor'
    ),
  toggleCurrentMode: (moduleId = 'canvas') => {
    const {
      modeStore,
      setCurrentMode,
      setIsPreviewInEditor,
      toggleLeftSidebar,
      isSidebarOpen,
      queryPanel,
      isRightSidebarOpen,
      setRightSidebarOpen,
    } = get();
    const { isQueryPaneExpanded, setIsQueryPaneExpanded } = queryPanel;

    const mode = modeStore.modules[moduleId].currentMode === 'edit' ? 'view' : 'edit';

    if (isQueryPaneExpanded) setIsQueryPaneExpanded(false);
    if (isSidebarOpen) toggleLeftSidebar(false);
    if (isRightSidebarOpen) setRightSidebarOpen(false);

    setTimeout(() => {
      setIsPreviewInEditor(mode === 'view');
      setCurrentMode(mode, moduleId);
    }, 0);
  },
  getCurrentMode: (moduleId) => get().modeStore.modules[moduleId].currentMode,
});
