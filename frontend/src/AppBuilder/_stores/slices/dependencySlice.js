import DependencyGraph from './DependencyClass';

const initialState = {
  dependencyGraph: {
    modules: {
      canvas: {
        graph: new DependencyGraph(),
      },
    },
  },
};

export const createDependencySlice = (set, get) => ({
  ...initialState,

  addDependency: (fromPath, toPath, nodeData) => {
    if (!get().checkIfDependencyExists(fromPath, toPath)) {
      set((state) => {
        state.dependencyGraph.modules.canvas.graph.addDependency(fromPath, toPath, nodeData);
        return { ...state };
      });
    }
  },

  updateDependency: (newFromPath, toPath, nodeData) =>
    set((state) => {
      state.dependencyGraph.modules.canvas.graph.updateDependency(newFromPath, toPath, nodeData);
      return { ...state };
    }),

  removeDependency: (toPath, clearToPath = false) =>
    set((state) => {
      state.dependencyGraph.modules.canvas.graph.removeDependency(toPath, clearToPath);
      return { ...state };
    }),

  removeNode: (path) =>
    set((state) => {
      state.dependencyGraph.modules.canvas.graph.removeNode(path);
      return { ...state };
    }),

  getNodeData: (path) => get().dependencyGraph.modules.canvas.graph.getNodeData(path),

  getDependencies: (path) => get().dependencyGraph.modules.canvas.graph.getDependencies(path),

  getDirectDependencies: (path) => get().dependencyGraph.modules.canvas.graph.getDirectDependencies(path),

  getDependents: (path) => get().dependencyGraph.modules.canvas.graph.getDependents(path),

  getDirectDependents: (path) => get().dependencyGraph.modules.canvas.graph.getDirectDependents(path),

  getOverallOrder: () => get().dependencyGraph.modules.canvas.graph.getOverallOrder(),

  checkIfDependencyExists: (fromPath, toPath) => {
    const dependencies = get().getDependencies(fromPath);
    return dependencies.includes(toPath);
  },
});
