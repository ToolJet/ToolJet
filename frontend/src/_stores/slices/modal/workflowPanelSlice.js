export const createWorkflowPanelSlice = (set, get) => ({
  panels: {
    leftDrawer: {
      isVisible: true,
      activeTab: 'queries',
    },
    logsPanel: {
      isVisible: false,
      height: 300,
    },
  },

  actions: {
    showLeftDrawer: () =>
      set((state) => {
        state.panels.leftDrawer.isVisible = true;
      }),

    hideLeftDrawer: () =>
      set((state) => {
        state.panels.leftDrawer.isVisible = false;
      }),

    setLeftDrawerTab: (tab) =>
      set((state) => {
        state.panels.leftDrawer.activeTab = tab;
      }),

    toggleLogsPanel: () =>
      set((state) => {
        state.panels.logsPanel.isVisible = !state.panels.logsPanel.isVisible;
      }),

    setLogsPanelHeight: (height) =>
      set((state) => {
        state.panels.logsPanel.height = height;
      }),
  },
});
