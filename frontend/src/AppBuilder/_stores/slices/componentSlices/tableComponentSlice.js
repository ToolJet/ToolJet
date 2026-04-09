import { DEFAULT_COMPONENT_STRUCTURE } from '../resolvedSlice';

export const tableComponentSlice = (set, get) => ({
  // Sync lazy row indices to resolved store and trigger resolution for expanded rows.
  // Reuses the existing updateDependencyValues → updateChildComponentResolvedValues pipeline;
  // the guard in updateChildComponentResolvedValues scopes the loop to lazyRowIndices.
  resolveExpandedRows: (tableId, lazyRowIndices, data, moduleId = 'canvas') => {
    const { getContainerChildrenMapping, updateDependencyValues } = get();
    const childComponents = getContainerChildrenMapping(tableId, moduleId);

    // Sync indices + populate customResolvables for expanded rows + ensure child arrays exist
    set((state) => {
      const mod = state.resolvedStore.modules[moduleId];
      if (!mod.lazyRowIndices) mod.lazyRowIndices = {};
      mod.lazyRowIndices[tableId] = lazyRowIndices;

      // Populate customResolvables only for expanded indices (avoids storing all N rows)
      if (!mod.customResolvables[tableId]) mod.customResolvables[tableId] = [];
      const resolvables = mod.customResolvables[tableId];
      lazyRowIndices.forEach((rowIndex) => {
        resolvables[rowIndex] = { rowData: data[rowIndex] };
      });

      // Ensure child component resolved arrays exist (they may still be plain objects
      // because updateChildComponentsLength was skipped for lazy parents)
      childComponents.forEach((componentId) => {
        if (!Array.isArray(mod.components[componentId])) {
          const template = mod.components[componentId] || { ...DEFAULT_COMPONENT_STRUCTURE };
          mod.components[componentId] = [template];
        }
      });
    });

    if (lazyRowIndices.length === 0) return;

    // Trigger resolution — reuses existing pipeline.
    // updateDependencyValues finds all deps on components.<tableId>.rowData,
    // calls updateChildComponentResolvedValues which is guarded to loop
    // only lazyRowIndices for lazy parents.
    updateDependencyValues(`components.${tableId}.rowData`, moduleId, []);
  },
});
