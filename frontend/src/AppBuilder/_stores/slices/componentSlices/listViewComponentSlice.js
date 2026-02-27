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
    // Fire property-level dependency update.
    // Example: user toggles checkbox in row 2 →
    //   updateDependencyValues('components.checkbox-uuid.value')
    //   → dependency graph finds: button's visibility depends on this key
    //   → triggers updateChildComponentResolvedValues for the button
    //   → which uses prepareRowScope/updateRowScope to resolve per row
    get().updateDependencyValues(`components.${componentId}.${property}`, moduleId, []);

    // Derive the ListView's children/data exposed values (used by {{components.listview1.data}})
    const parentId = get().getComponentDefinition(componentId, moduleId)?.component?.parent;
    const nearestListviewId = parentId ? get().findNearestSubcontainerAncestor(parentId, moduleId) : null;
    if (nearestListviewId) {
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
    // Fire property-level dependency updates for each changed key (same mechanism as above).
    Object.entries(values).forEach(([key, value]) => {
      if (typeof value !== 'function' && !skipKeys.has(key)) {
        get().updateDependencyValues(`components.${componentId}.${key}`, moduleId, []);
      }
    });

    // Derive ListView children/data
    const parentId = get().getComponentDefinition(componentId, moduleId)?.component?.parent;
    const nearestListviewId = parentId ? get().findNearestSubcontainerAncestor(parentId, moduleId) : null;
    if (nearestListviewId) {
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

  // ─── Row-Scoped Component Resolution ───────────────────────────────────────
  //
  // PROBLEM:
  //   Inside a ListView, components like checkbox1 store their exposed values as
  //   per-row arrays: components['checkbox-uuid'] = [{ value: false }, { value: true }, ...]
  //   But when resolving an expression like {{components.checkbox1.value}} for a button
  //   in row 2, we need the resolver to see the single row-2 object { value: true },
  //   not the full array.
  //
  // SOLUTION:
  //   We create a lightweight overlay object using Object.create(components).
  //   - The overlay inherits ALL entries from state.components via the prototype chain.
  //   - We then override ONLY the ListView's descendant entries on the overlay,
  //     replacing their arrays with the specific row's object.
  //   - When the resolver accesses a descendant (e.g., checkbox-uuid), it hits the
  //     overlay's own property → gets the row-specific value.
  //   - When the resolver accesses a non-descendant (e.g., a canvas-level button),
  //     it falls through the prototype → gets the global value from state.components.
  //
  // ──────────────────────────────────────────────────────────────────────────────

  // Called ONCE before the row loop. Collects descendant IDs and creates the
  // prototype overlay. Returns null if the ListView has no descendants.
  prepareRowScope: (components, listviewId, moduleId = 'canvas') => {
    const { getContainerChildrenMapping } = get();

    // Recursively collect ALL descendant component IDs of this ListView.
    // This includes components nested inside sub-containers (Form, Container, etc.).
    // Example: ListView → [Checkbox, Button, Form → [TextInput, Dropdown]]
    //   → allDescendants = [Checkbox, Button, Form, TextInput, Dropdown]
    const allDescendants = [];
    const collectDescendants = (containerId) => {
      const children = getContainerChildrenMapping(containerId, moduleId);
      if (!children) return;
      for (const childId of children) {
        allDescendants.push(childId);
        collectDescendants(childId);
      }
    };
    collectDescendants(listviewId);

    if (allDescendants.length === 0) return null;

    // Create a new object whose prototype is state.components.
    // Any property not explicitly set on `scoped` will fall through to state.components.
    const scoped = Object.create(components);

    // Pre-create writable own properties for each descendant.
    // WHY Object.defineProperty instead of plain assignment (scoped[childId] = {})?
    //   Immer freezes state.components after each store update, which makes all its
    //   properties non-writable. In JavaScript strict mode, if a prototype has a
    //   non-writable property, you CANNOT create a same-named own property on a
    //   derived object via plain assignment — it throws TypeError. But
    //   Object.defineProperty bypasses this restriction and creates the own property.
    //   After this, the own property is writable:true, so updateRowScope can use
    //   plain assignment (scoped[childId] = ...) without issues.
    for (const childId of allDescendants) {
      Object.defineProperty(scoped, childId, {
        value: {},
        writable: true,
        enumerable: true,
        configurable: true,
      });
    }

    return { scoped, descendantIds: allDescendants, components };
  },

  // Called PER ROW inside the loop. Mutates the same `scoped` object in place —
  // overwrites each descendant's own property with the row-specific value.
  // Uses plain assignment (fast) because prepareRowScope already created writable
  // own properties via Object.defineProperty.
  //
  // Example for row 2:
  //   components['checkbox-uuid'] = [{ value: false }, { value: false }, { value: true }]
  //   → scoped['checkbox-uuid'] = { value: true }   (the row-2 entry)
  //
  // The scoped object is shared across rows — we just overwrite the values each iteration.
  // This works because resolveDynamicValues is synchronous and doesn't hold references.
  updateRowScope: (scopeCtx, rowIndex) => {
    const { scoped, descendantIds, components } = scopeCtx;
    for (const childId of descendantIds) {
      const val = components[childId];
      if (Array.isArray(val)) {
        scoped[childId] = val[rowIndex] ?? {};
      }
    }
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
    const { findNearestSubcontainerAncestor, getComponentDefinition, deriveListviewExposedData } = get();

    let currentLV = nearestListviewId;
    let currentIndices = [...indices];

    while (currentLV && currentIndices.length > 0) {
      const rowIndex = currentIndices[currentIndices.length - 1];
      const outerIndices = currentIndices.slice(0, -1);
      deriveListviewExposedData(currentLV, rowIndex, outerIndices, moduleId);

      // Move up to outer ListView
      const lvDef = getComponentDefinition(currentLV, moduleId);
      const lvParent = lvDef?.component?.parent;
      currentLV = lvParent ? findNearestSubcontainerAncestor(lvParent, moduleId) : null;
      currentIndices = outerIndices;
    }
  },
});
