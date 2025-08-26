export const createWorkflowNodePreviewSlice = (set, get) => ({
  nodePreview: {
    states: {},
    executionDetails: {},
  },

  actions: {
    setNodePreviewState: (nodeId, state) =>
      set((draft) => {
        draft.nodePreview.states[nodeId] = state;
      }),

    setNodePreviewLoading: (nodeId, loading) =>
      set((draft) => {
        if (!draft.nodePreview.states[nodeId]) {
          draft.nodePreview.states[nodeId] = {};
        }
        draft.nodePreview.states[nodeId].loading = loading;
      }),

    setNodePreviewResult: (nodeId, result) =>
      set((draft) => {
        if (!draft.nodePreview.states[nodeId]) {
          draft.nodePreview.states[nodeId] = {};
        }
        draft.nodePreview.states[nodeId].result = result;
        draft.nodePreview.states[nodeId].loading = false;
      }),

    setNodePreviewError: (nodeId, error) =>
      set((draft) => {
        if (!draft.nodePreview.states[nodeId]) {
          draft.nodePreview.states[nodeId] = {};
        }
        draft.nodePreview.states[nodeId].error = error;
        draft.nodePreview.states[nodeId].loading = false;
      }),

    clearNodePreviewState: (nodeId) =>
      set((draft) => {
        delete draft.nodePreview.states[nodeId];
      }),

    setExecutionDetails: (nodeId, details) =>
      set((draft) => {
        draft.nodePreview.executionDetails[nodeId] = details;
      }),

    clearExecutionDetails: (nodeId) =>
      set((draft) => {
        delete draft.nodePreview.executionDetails[nodeId];
      }),

    clearAllPreviews: () =>
      set((draft) => {
        draft.nodePreview.states = {};
        draft.nodePreview.executionDetails = {};
      }),
  },
});
