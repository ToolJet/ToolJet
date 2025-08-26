export const createWorkflowCanvasSlice = (set, get) => ({
  canvas: {
    nodes: [],
    edges: [],
  },

  actions: {
    setNodes: (nodes) =>
      set((state) => {
        state.canvas.nodes = nodes;
      }),

    setEdges: (edges) =>
      set((state) => {
        state.canvas.edges = edges;
      }),

    addNode: (node) =>
      set((state) => {
        state.canvas.nodes.push(node);
      }),

    updateNode: (nodeId, updates) =>
      set((state) => {
        const nodeIndex = state.canvas.nodes.findIndex((n) => n.id === nodeId);
        if (nodeIndex !== -1) {
          Object.assign(state.canvas.nodes[nodeIndex], updates);
        }
      }),

    removeNode: (nodeId) =>
      set((state) => {
        state.canvas.nodes = state.canvas.nodes.filter((n) => n.id !== nodeId);
        state.canvas.edges = state.canvas.edges.filter((e) => e.source !== nodeId && e.target !== nodeId);
      }),

    addEdge: (edge) =>
      set((state) => {
        state.canvas.edges.push(edge);
      }),

    updateFlow: ({ nodes, edges }) =>
      set((state) => {
        if (nodes) state.canvas.nodes = nodes;
        if (edges) state.canvas.edges = edges;
      }),
  },
});
