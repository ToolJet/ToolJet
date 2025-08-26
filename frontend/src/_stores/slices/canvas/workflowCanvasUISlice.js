export const createWorkflowCanvasUISlice = (set, get) => ({
  canvasUI: {
    selectedNode: null,
    lastMousePosition: { x: 100, y: 100 },
    showBlockOptions: false,
    isDragging: false,
    contextMenu: { visible: false, x: 0, y: 0 },
    editingActivity: { type: 'IDLE' },
    leftDrawer: { display: '' },
  },

  actions: {
    setSelectedNode: (node) =>
      set((state) => {
        state.canvasUI.selectedNode = node;
      }),

    setLastMousePosition: (position) =>
      set((state) => {
        state.canvasUI.lastMousePosition = position;
      }),

    setShowBlockOptions: (show) =>
      set((state) => {
        state.canvasUI.showBlockOptions = show;
      }),

    setIsDragging: (dragging) =>
      set((state) => {
        state.canvasUI.isDragging = dragging;
      }),

    setContextMenu: (menu) =>
      set((state) => {
        state.canvasUI.contextMenu = menu;
      }),

    setEditingActivity: (activity) =>
      set((state) => {
        state.canvasUI.editingActivity = activity;
      }),

    setLeftDrawerDisplay: (display) =>
      set((state) => {
        state.canvasUI.leftDrawer.display = display;
      }),

    toggleLeftDrawer: (displayType) =>
      set((state) => {
        if (state.canvasUI.leftDrawer.display === '') {
          state.canvasUI.leftDrawer.display = displayType;
        } else {
          state.canvasUI.leftDrawer.display = '';
        }
      }),
  },
});
