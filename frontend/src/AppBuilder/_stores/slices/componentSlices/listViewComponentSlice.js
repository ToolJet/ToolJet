import { isEqual } from 'lodash';
import { removeFunctionObjects } from '@/_helpers/appUtils';
import { deepClone } from '@/_helpers/utilities/utils.helpers';

export const listViewComponentSlice = (set, get) => ({
  // Per-row exposed value write for ListView children.
  // After writing, derives the parent ListView's children/data directly in the store.
  setExposedValuePerRow: (componentId, property, value, indices, moduleId = 'canvas') => {
    set(
      (state) => {
        const components = state.resolvedStore.modules[moduleId].exposedValues.components;
        if (!Array.isArray(components[componentId])) {
          components[componentId] = [];
        }
        let current = components[componentId];
        for (let i = 0; i < indices.length - 1; i++) {
          const idx = indices[i];
          if (!current[idx]) {
            current[idx] = [];
          } else if (!Array.isArray(current[idx])) {
            current[idx] = [current[idx]];
          }
          current = current[idx];
        }
        const lastIdx = indices[indices.length - 1];
        if (!current[lastIdx] || typeof current[lastIdx] !== 'object' || Array.isArray(current[lastIdx])) {
          current[lastIdx] = {};
        }
        current[lastIdx][property] = value;
      },
      false,
      {
        type: 'setExposedValuePerRow',
        payload: { componentId, property, value, indices, moduleId },
      }
    );
    // Fire property-level dependency update. Components with property-level siblings deps
    // (e.g., {{siblings.radiobutton1.value}}) are registered against this exact key in the
    // dependency graph via getCustomResolvableReference, so they re-resolve here.
    get().updateDependencyValues(`components.${componentId}.${property}`, moduleId, []);

    // Derive ListView children/data and trigger coarse siblings fallback
    const parentId = get().getComponentDefinition(componentId, moduleId)?.component?.parent;
    const nearestListviewId = parentId ? get().findNearestListviewAncestor(parentId, moduleId) : null;
    if (nearestListviewId) {
      // Coarse siblings trigger — only affects components using the fallback dependency
      // (bare {{siblings}} or {{siblings.radiobutton1}} without a specific property).
      // Components with property-level deps (e.g., {{siblings.radiobutton1.value}}) are NOT
      // registered against this key, so this trigger doesn't cause extra re-resolutions for them.
      get().updateDependencyValues(`components.${nearestListviewId}.siblings`, moduleId, []);
      get()._deriveListviewChain(nearestListviewId, indices, moduleId);
    }
  },

  // Batch per-row exposed value write for ListView children.
  setExposedValuesPerRow: (componentId, values, indices, moduleId = 'canvas') => {
    const skipKeys = new Set();
    set(
      (state) => {
        const components = state.resolvedStore.modules[moduleId].exposedValues.components;
        if (!Array.isArray(components[componentId])) {
          components[componentId] = [];
        }
        let current = components[componentId];
        for (let i = 0; i < indices.length - 1; i++) {
          const idx = indices[i];
          if (!current[idx]) {
            current[idx] = [];
          } else if (!Array.isArray(current[idx])) {
            current[idx] = [current[idx]];
          }
          current = current[idx];
        }
        const lastIdx = indices[indices.length - 1];
        if (!current[lastIdx] || typeof current[lastIdx] !== 'object' || Array.isArray(current[lastIdx])) {
          current[lastIdx] = {};
        }
        Object.entries(values).forEach(([key, value]) => {
          if (isEqual(value, current[lastIdx][key])) {
            skipKeys.add(key);
          } else {
            current[lastIdx][key] = value;
          }
        });
      },
      false,
      {
        type: 'setExposedValuesPerRow',
        payload: { componentId, values, indices, moduleId },
      }
    );
    // Fire property-level dependency updates for each changed key.
    // Components with property-level siblings deps are registered against these exact keys.
    Object.entries(values).forEach(([key, value]) => {
      if (typeof value !== 'function' && !skipKeys.has(key)) {
        get().updateDependencyValues(`components.${componentId}.${key}`, moduleId, []);
      }
    });

    // Derive ListView children/data and trigger coarse siblings fallback
    const parentId = get().getComponentDefinition(componentId, moduleId)?.component?.parent;
    const nearestListviewId = parentId ? get().findNearestListviewAncestor(parentId, moduleId) : null;
    if (nearestListviewId) {
      // Coarse siblings trigger — only affects components using the fallback dependency
      // (bare {{siblings}} or {{siblings.radiobutton1}} without a specific property).
      // Components with property-level deps are NOT registered against this key.
      get().updateDependencyValues(`components.${nearestListviewId}.siblings`, moduleId, []);
      get()._deriveListviewChain(nearestListviewId, indices, moduleId);
    }
  },

  // Initialize exposed value arrays for all children of a ListView
  initExposedValueArrayForChildren: (listviewId, rowCount, moduleId = 'canvas', parentIndices = []) => {
    const { getContainerChildrenMapping } = get();
    const childComponents = getContainerChildrenMapping(listviewId, moduleId);
    set((state) => {
      const components = state.resolvedStore.modules[moduleId].exposedValues.components;
      childComponents.forEach((childId) => {
        if (parentIndices.length === 0) {
          if (!Array.isArray(components[childId])) {
            components[childId] = [];
          }
          const arr = components[childId];
          if (arr.length < rowCount) {
            for (let i = arr.length; i < rowCount; i++) {
              if (!arr[i]) arr[i] = {};
            }
          }
          arr.length = rowCount;
        } else {
          if (!Array.isArray(components[childId])) {
            components[childId] = [];
          }
          let current = components[childId];
          for (let i = 0; i < parentIndices.length; i++) {
            const idx = parentIndices[i];
            if (!current[idx]) {
              current[idx] = [];
            } else if (!Array.isArray(current[idx])) {
              current[idx] = [current[idx]];
            }
            current = current[idx];
          }
          if (current.length < rowCount) {
            for (let i = current.length; i < rowCount; i++) {
              if (!current[i]) current[i] = {};
            }
          }
          current.length = rowCount;
        }
      });

      // Also clean up stale rows from the ListView's own children/data
      const lvExposed = components[listviewId];
      if (lvExposed && !Array.isArray(lvExposed)) {
        if (lvExposed.children) {
          Object.keys(lvExposed.children).forEach((key) => {
            if (parseInt(key) >= rowCount) {
              delete lvExposed.children[key];
              if (lvExposed.data) delete lvExposed.data[key];
            }
          });
        }
      }
    });
  },

  // Build a siblings object for a given row of a ListView.
  // Returns { componentName: { ...exposedValues } } for all children at that row index.
  buildSiblingsForRow: (listviewId, rowIndex, moduleId = 'canvas') => {
    const { getContainerChildrenMapping, getComponentNameFromId } = get();
    const childIds = getContainerChildrenMapping(listviewId);
    const exposedComponents = get().resolvedStore.modules[moduleId]?.exposedValues?.components;
    const siblings = {};
    childIds.forEach((childId) => {
      const name = getComponentNameFromId(childId, moduleId);
      const childExposed = exposedComponents?.[childId];
      if (Array.isArray(childExposed) && childExposed[rowIndex]) {
        siblings[name] = childExposed[rowIndex];
      }
    });
    return siblings;
  },

  // Derive a single row's data for a ListView and write to the store.
  // For outerIndices=[] (top-level): writes to exposedValues.components[listviewId].children[rowIndex]
  // For outerIndices=[i] (nested): writes to exposedValues.components[listviewId][i].children[rowIndex]
  deriveListviewExposedData: (listviewId, rowIndex, outerIndices, moduleId = 'canvas') => {
    const { getContainerChildrenMapping, getComponentNameFromId } = get();
    const childIds = getContainerChildrenMapping(listviewId);
    const exposedComponents = get().resolvedStore.modules[moduleId]?.exposedValues?.components;

    // Build row data for the given rowIndex
    const rowData = {};
    childIds.forEach((childId) => {
      const childName = getComponentNameFromId(childId, moduleId);
      let childExposed = exposedComponents?.[childId];
      // Navigate through outer indices for nested ListViews
      for (const idx of outerIndices) {
        if (!Array.isArray(childExposed)) {
          childExposed = undefined;
          break;
        }
        childExposed = childExposed[idx];
      }
      // Now childExposed is the array of rows at this nesting level
      if (Array.isArray(childExposed) && childExposed[rowIndex]) {
        rowData[childName] = { ...childExposed[rowIndex], id: childId };
      }
    });

    const clonedRowData = removeFunctionObjects(deepClone(rowData));

    set((state) => {
      const exposed = state.resolvedStore.modules[moduleId].exposedValues.components;

      // Navigate to the correct target for this ListView's exposed values
      let target;
      if (outerIndices.length === 0) {
        // Top-level ListView: exposed values are a plain object
        if (!exposed[listviewId] || Array.isArray(exposed[listviewId])) {
          if (!exposed[listviewId]) exposed[listviewId] = {};
          // If it's an array (shouldn't happen for top-level), skip
          if (Array.isArray(exposed[listviewId])) return;
        }
        target = exposed[listviewId];
      } else {
        // Nested ListView: navigate through outerIndices
        if (!Array.isArray(exposed[listviewId])) return;
        target = exposed[listviewId];
        for (const idx of outerIndices) {
          if (Array.isArray(target)) {
            if (!target[idx]) target[idx] = {};
            target = target[idx];
          } else {
            return; // Can't navigate
          }
        }
        if (!target || typeof target !== 'object' || Array.isArray(target)) return;
      }

      // Ensure children/data are plain objects (not arrays).
      // The widget config initializes data as [{}] (array), but production format is an object
      // keyed by row index: { 0: {...}, 1: {...} }. Without this check, the array persists
      // because ![] is false (arrays are truthy), and numeric indices get set on the array.
      if (!target.children || Array.isArray(target.children)) target.children = {};
      if (!target.data || Array.isArray(target.data)) target.data = {};
      target.children[rowIndex] = rowData;
      target.data[rowIndex] = clonedRowData;
    });

    get().updateDependencyValues(`components.${listviewId}.children`, moduleId, []);
    get().updateDependencyValues(`components.${listviewId}.data`, moduleId, []);
  },

  // Walk up the ListView ancestor chain, deriving children/data at each level.
  // indices = the per-row indices from the child write (e.g., [outerRow, innerRow])
  _deriveListviewChain: (nearestListviewId, indices, moduleId = 'canvas') => {
    const { findNearestListviewAncestor, getComponentDefinition, deriveListviewExposedData } = get();

    let currentLV = nearestListviewId;
    let currentIndices = [...indices];

    while (currentLV && currentIndices.length > 0) {
      const rowIndex = currentIndices[currentIndices.length - 1];
      const outerIndices = currentIndices.slice(0, -1);
      deriveListviewExposedData(currentLV, rowIndex, outerIndices, moduleId);

      // Move up to outer ListView
      const lvDef = getComponentDefinition(currentLV, moduleId);
      const lvParent = lvDef?.component?.parent;
      currentLV = lvParent ? findNearestListviewAncestor(lvParent, moduleId) : null;
      currentIndices = outerIndices;
    }
  },
});
