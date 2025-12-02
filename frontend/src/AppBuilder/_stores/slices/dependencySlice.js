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
  initializeDependencySlice: (moduleId) => {
    set(
      (state) => {
        state.dependencyGraph.modules[moduleId] = {
          graph: new DependencyGraph(),
        };
      },
      false,
      'initializeDependencySlice'
    );
  },

  addDependency: (fromPath, toPath, nodeData, moduleId = 'canvas') => {
    if (!get().checkIfDependencyExists(fromPath, toPath, moduleId)) {
      set((state) => {
        state.dependencyGraph.modules[moduleId].graph.addDependency(fromPath, toPath, nodeData);
        return { ...state };
      });
    }
  },

  updateDependency: (newFromPath, toPath, nodeData, moduleId = 'canvas') =>
    set((state) => {
      state.dependencyGraph.modules[moduleId].graph.updateDependency(newFromPath, toPath, nodeData);
      return { ...state };
    }),

  removeDependency: (toPath, clearToPath = false, moduleId = 'canvas') =>
    set((state) => {
      state.dependencyGraph.modules[moduleId].graph.removeDependency(toPath, clearToPath);
      return { ...state };
    }),

  removeNode: (path, moduleId = 'canvas') =>
    set((state) => {
      state.dependencyGraph.modules[moduleId].graph.removeNode(path);
      return { ...state };
    }),

  getNodeData: (path, moduleId = 'canvas') => get().dependencyGraph.modules[moduleId].graph.getNodeData(path),

  getDependencies: (path, moduleId = 'canvas') => get().dependencyGraph.modules[moduleId].graph.getDependencies(path),

  getDirectDependencies: (path, moduleId = 'canvas') =>
    get().dependencyGraph.modules[moduleId].graph.getDirectDependencies(path),

  getDependents: (path, moduleId = 'canvas') => get().dependencyGraph.modules[moduleId].graph.getDependents(path),

  getDirectDependents: (path, moduleId = 'canvas') =>
    get().dependencyGraph.modules[moduleId].graph.getDirectDependents(path),

  getOverallOrder: (moduleId = 'canvas') => get().dependencyGraph.modules[moduleId].graph.getOverallOrder(),

  checkIfDependencyExists: (fromPath, toPath, moduleId = 'canvas') => {
    const dependencies = get().getDependencies(fromPath, moduleId);
    return dependencies.includes(toPath);
  },
});
