const initialState = {
  selectedNodes: new Set(),
  searchedNodes: new Set(),
  inspectorSearchValue: '',
  inspectorSearchResults: new Set(),
};

export const createInspectorSlice = (set, get) => ({
  ...initialState,
  getSelectedNodes: () => {
    const selectedNodes = get().selectedNodes;
    return Array.from(selectedNodes);
  },
  setSelectedNodes: (node) => {
    const selectedNodes = get().selectedNodes;
    const newSelectedNodes = new Set(selectedNodes);
    if (newSelectedNodes.has(node)) {
      newSelectedNodes.delete(node);
    } else {
      newSelectedNodes.add(node);
    }
    set({ selectedNodes: newSelectedNodes });
  },
  getInspectorSearchResults: () => {
    const inspectorSearchResults = get().inspectorSearchResults;
    return Array.from(inspectorSearchResults);
  },
  setInspectorSearchValue: (value) => {
    set({ inspectorSearchValue: value });
  },
  setInspectorSearchResults: (results) => {
    set({ inspectorSearchResults: results });
  },
});
