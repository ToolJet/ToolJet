export const createWorkflowQuerySlice = (set, get) => ({
  queries: {
    list: [],
    previewStates: {},
  },

  actions: {
    setQueries: (queries) =>
      set((state) => {
        state.queries.list = queries;
      }),

    addQuery: (query) =>
      set((state) => {
        state.queries.list.push(query);
      }),

    updateQuery: (idOnDefinition, updates) =>
      set((state) => {
        const queryIndex = state.queries.list.findIndex((q) => q.idOnDefinition === idOnDefinition);
        if (queryIndex !== -1) {
          Object.assign(state.queries.list[queryIndex], updates);
        }
      }),

    removeQuery: (idOnDefinition) =>
      set((state) => {
        state.queries.list = state.queries.list.filter((q) => q.idOnDefinition !== idOnDefinition);
      }),

    setQueryPreviewState: (queryId, previewState) =>
      set((state) => {
        state.queries.previewStates[queryId] = previewState;
      }),

    clearQueryPreviewState: (queryId) =>
      set((state) => {
        delete state.queries.previewStates[queryId];
      }),
  },
});
