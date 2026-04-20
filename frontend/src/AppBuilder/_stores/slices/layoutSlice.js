const initialState = {
  currentLayout: 'desktop',
  canvasWidth: 1092,
  canvasBackground: {},
  showToggleLayoutBtn: true,
  showUndoRedoBtn: true,
  showFullWidth: false,
};

export const createLayoutSlice = (set, get) => ({
  ...initialState,
  toggleCurrentLayout: (currentLayout) => {
    get().clearSelectedComponents();
    // temporaryLayouts hold the previous layout's reflow output (keyed only by
    // componentId, not layout). Clearing prevents desktop reflow results from
    // being applied to the mobile canonical (or vice versa) for the one frame
    // before useDynamicHeight re-fires.
    get().clearTemporaryLayouts();
    set({ currentLayout }, false, {
      type: 'TOGGLE_CURRENT_LAYOUT',
      currentLayout,
    });
  },
  setCanvasWidth: (editorCanvasWidth) => set({ editorCanvasWidth }),
  setCanvasBackground: (canvasBackground) => set({ canvasBackground }),
  setCurrentLayout: (currentLayout) => {
    get().clearSelectedComponents();
    get().clearTemporaryLayouts();
    set({ currentLayout }, false, 'setCurrentLayout');
  },
  setShowToggleLayoutBtn: (show) => set({ showToggleLayoutBtn: show }),
  setShowUndoRedoBtn: (show) => set({ showUndoRedoBtn: show }),
  setShowFullWidth: (show) => set({ showFullWidth: show }),
});
