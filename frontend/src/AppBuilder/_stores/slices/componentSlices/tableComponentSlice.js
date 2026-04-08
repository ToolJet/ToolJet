import { DEFAULT_COMPONENT_STRUCTURE } from '../resolvedSlice';

export const tableComponentSlice = (set, get) => ({
  // Sync lazy row indices to resolved store and trigger resolution for them.
  // Reuses the existing updateDependencyValues → updateChildComponentResolvedValues pipeline;
  // the guard in updateChildComponentResolvedValues scopes the loop to lazyRowIndices.
  resolveExpandedRows: (tableId, lazyRowIndices, moduleId = 'canvas') => {
    const { getContainerChildrenMapping, updateDependencyValues } = get();

    // 1. Sync indices to resolved store so the guard in updateChildComponentResolvedValues
    //    knows which rows to resolve
    set((state) => {
      if (!state.resolvedStore.modules[moduleId].lazyRowIndices) {
        state.resolvedStore.modules[moduleId].lazyRowIndices = {};
      }
      state.resolvedStore.modules[moduleId].lazyRowIndices[tableId] = lazyRowIndices;
    });

    if (lazyRowIndices.length === 0) return;

    // 2. Ensure child component resolved arrays exist (they may still be plain objects
    //    because updateChildComponentsLength was skipped for lazy parents)
    const childComponents = getContainerChildrenMapping(tableId, moduleId);
    set((state) => {
      childComponents.forEach((componentId) => {
        const store = state.resolvedStore.modules[moduleId].components;
        if (!Array.isArray(store[componentId])) {
          const template = store[componentId] || { ...DEFAULT_COMPONENT_STRUCTURE };
          store[componentId] = [template];
        }
      });
    });

    // 3. Trigger resolution — reuses existing pipeline.
    //    updateDependencyValues finds all deps on components.<tableId>.rowData,
    //    calls updateChildComponentResolvedValues which is guarded to loop
    //    only lazyRowIndices for lazy parents.
    updateDependencyValues(`components.${tableId}.rowData`, moduleId, []);
  },
});
