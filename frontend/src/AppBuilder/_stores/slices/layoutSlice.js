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
    set({ currentLayout }, false, {
      type: 'TOGGLE_CURRENT_LAYOUT',
      currentLayout,
    });
  },
  setCanvasWidth: (editorCanvasWidth) => set({ editorCanvasWidth }),
  setCanvasBackground: (canvasBackground) => set({ canvasBackground }),
  setCurrentLayout: (currentLayout) => {
    get().clearSelectedComponents();
    set({ currentLayout }, false, 'setCurrentLayout');
  },
  setShowToggleLayoutBtn: (show) => set({ showToggleLayoutBtn: show }),
  setShowUndoRedoBtn: (show) => set({ showUndoRedoBtn: show }),
  setShowFullWidth: (show) => set({ showFullWidth: show }),
});
