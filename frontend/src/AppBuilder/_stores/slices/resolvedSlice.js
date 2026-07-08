import { resolveDynamicValues } from '../utils';
import { extractAndReplaceReferencesFromString } from '@/AppBuilder/_stores/ast';
import { componentTypeDefinitionMap } from '@/AppBuilder/WidgetManager';
import { createBatchManager } from '@/AppBuilder/_stores/batchManager';
import { ROW_SCOPED_WIDGET_TYPES } from '@/AppBuilder/AppCanvas/appCanvasConstants';
import { removeFunctionObjects } from '@/_helpers/appUtils';
import { deepClone } from '@/_helpers/utilities/utils.helpers';
import _ from 'lodash';

// Per-moduleId cache for getAllExposedValues' lazy-ListView-read Proxy —
// see _wrapExposedComponentsForLazyListviewRead below.
const _lazyComponentsProxyCache = new Map();

const initialState = {
  resolvedStore: {
    modules: {
      canvas: {
        others: {
          canvasBackgroundColor: null,
          isPagesSidebarHidden: true,
          pages: {},
        },
        components: {},
        secrets: {},
        customResolvables: {},
        lazyResolvableParents: {}, // { [componentId]: true } — parents that defer resolution (e.g. Table expandable rows)
        lazyRowIndices: {}, // { [componentId]: number[] } — row indices to resolve for lazy parents
        exposedValues: {
          queries: {} /* IMPORTANT: Query is subscribed by the moduleContainer component */,
          components: {},
          variables: {},
          constants: {},
          globals: {},
          page: {
            variables: {},
          },
        },
      },
    },
  },
};

export const DEFAULT_COMPONENT_STRUCTURE = {
  properties: {},
  styles: {},
  validation: {},
  others: {},
  generalStyles: {},
  general: {},
};

// Builds the Immer mutation for writing a single exposed-value property.
// Handles the case where a component moved from ListView (array structure) to canvas (plain object).
const buildExposedValueMutation = (componentId, property, value, moduleId) => (state) => {
  const components = state.resolvedStore.modules[moduleId].exposedValues.components;
  if (components[componentId] === undefined || Array.isArray(components[componentId])) {
    components[componentId] = { [property]: value };
  }
  components[componentId][property] = value;
};

export const createResolvedSlice = (set, get) => {
  const _exposedValueBatch = createBatchManager(set, get);

  // Implicit microtask batch: coalesces dep cascades from setVariable / setExposedValue
  // calls that happen outside an explicit batch window (ListView/Form bracket).
  // Store writes are synchronous (reads work immediately in the same runJS context);
  // only the dep resolution is deferred.
  let _implicitBatchScheduled = false;
  const scheduleDependencyUpdate = (depPath, moduleId) => {
    if (_exposedValueBatch.isBatching()) {
      // Explicit batch already open — add the dep path to it
      _exposedValueBatch.bufferDepPath(depPath, moduleId);
      return;
    }
    if (!_implicitBatchScheduled) {
      _implicitBatchScheduled = true;
      _exposedValueBatch.startBatch();
      queueMicrotask(() => {
        _implicitBatchScheduled = false;
        _exposedValueBatch.flush('implicitMicrotaskBatch');
      });
    }
    _exposedValueBatch.bufferDepPath(depPath, moduleId);
  };

  return {
    ...initialState,
    initializeResolvedSlice: (moduleId) => {
      set(
        (state) => {
          state.resolvedStore.modules[moduleId] = {
            ...initialState.resolvedStore.modules.canvas,
          };
        },
        false,
        'initializeResolvedSlice'
      );
    },

    startExposedValueBatch: () => {
      _exposedValueBatch.startBatch();
    },

    flushExposedValueBatch: () => {
      _exposedValueBatch.flush('flushExposedValueBatch');
    },

    isExposedValueBatching: () => _exposedValueBatch.isBatching(),

    bufferExposedValueMutation: (mutation, depPaths) => {
      _exposedValueBatch.bufferMutation(mutation, depPaths);
    },

    bufferExposedValuePostFlush: (cb, dedupeKey) => {
      _exposedValueBatch.bufferPostFlushCallback(cb, dedupeKey);
    },

    setResolvedGlobals: (objKey, values, moduleId = 'canvas') => {
      set(
        (state) => {
          const globals = state.resolvedStore.modules[moduleId].exposedValues.globals;
          if (Object.keys(values).length === 0) {
            globals[objKey] = {};
          } else {
            if (!globals[objKey]) globals[objKey] = {};
            Object.assign(globals[objKey], values);
          }
        },
        false,
        'setResolvedGlobals'
      );
      get().updateDependencyValues(`globals.${objKey}`, moduleId);
    },
    setResolvedConstants: (constants = {}, moduleId = 'canvas') => {
      set(
        (state) => {
          Object.entries(constants).forEach(([key, value]) => {
            state.resolvedStore.modules[moduleId].exposedValues.constants[key] = value;
          });
        },
        false,
        'setResolvedConstants'
      );
      Object.entries(constants).forEach(([key, value]) => {
        get().updateDependencyValues(`constants.${key}`, moduleId);
      });
    },

    setSecrets: (secrets = {}, moduleId = 'canvas') => {
      set((state) => {
        Object.entries(secrets).forEach(([key, value]) => {
          state.resolvedStore.modules[moduleId].secrets[key] = value;
        });
      });
    },

    // setVariables: (variables = {}, moduleId = 'canvas') => {
    //   if (!variables || typeof variables !== 'object' || Array.isArray(variables)) return;

    //   const keys = Object.keys(variables);
    //   if (keys.length === 0) return;

    //   set(
    //     (state) => {
    //       Object.assign(state.resolvedStore.modules[moduleId].exposedValues.variables, variables);
    //     },
    //     false,
    //     'setVariablesBatch'
    //   );

    //   // Route all dep paths through scheduleDependencyUpdate so they coalesce with
    //   // any concurrent setVariable / setExposedVariable calls in the same microtask batch.
    //   keys.forEach((key) => scheduleDependencyUpdate(`variables.${key}`, moduleId));
    //   get().rebuildVariableHints(moduleId);
    // },

    setResolvedPageConstants: (constants = {}, moduleId = 'canvas') => {
      set(
        (state) => {
          Object.entries(constants).forEach(([key, value]) => {
            state.resolvedStore.modules[moduleId].exposedValues.page[key] = value;
          });
        },
        false,
        'setResolvedPageConstants'
      );
      Object.entries(constants).forEach(([key, value]) => {
        get().updateDependencyValues(`page.${key}`, moduleId);
      });
    },

    // variables
    setVariable: (key, value, moduleId = 'canvas') => {
      // Synchronous write so getVariable reads the new value immediately in the same runJS context.
      set(
        (state) => {
          state.resolvedStore.modules[moduleId].exposedValues.variables[key] = value;
        },
        false,
        'setVariable'
      );
      // Dep cascade is deferred — coalesces with concurrent setVariable / setExposedVariable calls.
      scheduleDependencyUpdate(`variables.${key}`, moduleId);
      get().rebuildVariableHints(moduleId);
    },

    getVariable: (key, moduleId = 'canvas') => {
      return get().resolvedStore.modules[moduleId].exposedValues.variables[key];
    },

    unsetVariable: (key, moduleId = 'canvas') => {
      set(
        (state) => {
          delete state.resolvedStore.modules[moduleId].exposedValues.variables[key];
        },
        false,
        'unsetVariable'
      );
      get().removeNode(`variables.${key}`, moduleId);
      get().updateDependencyValues(`variables.${key}`, moduleId);
      get().rebuildVariableHints(moduleId);
    },

    unsetAllVariables: (moduleId = 'canvas') => {
      const variables = get().resolvedStore.modules[moduleId].exposedValues.variables;
      set(
        (state) => {
          state.resolvedStore.modules[moduleId].exposedValues.variables = {};
        },
        false,
        'unsetAllVariables'
      );
      Object.keys(variables).forEach((key) => {
        get().removeNode(`variables.${key}`);
        get().updateDependencyValues(`variables.${key}`);
      });
      get().rebuildVariableHints(moduleId);
    },

    // page.variables
    setPageVariable: (key, value, moduleId = 'canvas') => {
      set(
        (state) => {
          state.resolvedStore.modules[moduleId].exposedValues.page.variables[key] = value;
        },
        false,
        'setPageVariable'
      );
      get().updateDependencyValues(`page.variables.${key}`, moduleId);
      get().rebuildVariableHints(moduleId);
    },

    getPageVariable: (key, moduleId = 'canvas') => {
      return get().resolvedStore.modules[moduleId].exposedValues.page.variables[key];
    },
    unsetPageVariable: (key, moduleId = 'canvas') => {
      set(
        (state) => {
          delete state.resolvedStore.modules[moduleId].exposedValues.page.variables[key];
        },
        false,
        'unsetPageVariable'
      );
      get().removeNode(`page.variables.${key}`, moduleId);
      get().updateDependencyValues(`page.variables.${key}`, moduleId);
      get().rebuildVariableHints(moduleId);
    },

    unsetAllPageVariables: (moduleId = 'canvas') => {
      const pageVariables = get().resolvedStore.modules[moduleId].exposedValues.page.variables;
      set(
        (state) => {
          state.resolvedStore.modules[moduleId].exposedValues.page.variables = {};
        },
        false,
        'unsetAllPageVariables'
      );
      Object.keys(pageVariables).forEach((key) => {
        get().removeNode(`page.variables.${key}`);
        get().updateDependencyValues(`page.variables.${key}`);
      });
      get().rebuildVariableHints(moduleId);
    },

    setResolvedQuery: (queryId, details, moduleId = 'canvas', replaceObject = false) => {
      set(
        (state) => {
          state.resolvedStore.modules[moduleId].exposedValues.queries[queryId] = {
            ...(replaceObject ? {} : state.resolvedStore.modules[moduleId]?.exposedValues?.queries?.[queryId]),
            ...details,
          };
        },
        false,
        'setResolvedQuery'
      );

      Object.entries(details).forEach(([key, value]) => {
        if (
          ['isLoading', 'data', 'rawData', 'request', 'response', 'responseHeaders', 'metadata', 'error'].includes(key)
        ) {
          if (typeof value !== 'function') get().updateDependencyValues(`queries.${queryId}.${key}`, moduleId);
        }
      });
      get().rebuildQueryHints(moduleId, queryId);
    },
    initialiseResolvedQuery: (querIds, moduleId = 'canvas') => {
      const defaultObject = {};
      querIds.forEach((queryId) => {
        defaultObject[queryId] = {
          isLoading: false,
          data: [],
          rawData: [],
          id: queryId,
        };
      });
      set((state) => {
        state.resolvedStore.modules[moduleId].exposedValues.queries = defaultObject;
      });
    },
    setResolvedComponent: (componentId, data, moduleId = 'canvas') => {
      set(
        (state) => {
          state.resolvedStore.modules[moduleId].components[componentId] = data;
        },
        false,
        {
          type: 'setResolvedComponent',
          payload: { componentId, data, moduleId },
        }
      );
    },
    setResolvedComponents: (components, moduleId = 'canvas') => {
      const validateComponents = get().debugger.validateComponents;

      const validatedComponents = validateComponents(components, moduleId);

      set(
        (state) => {
          state.resolvedStore.modules[moduleId].components = validatedComponents;
        },
        false,
        'setResolvedComponents'
      );
    },

    /*
    index - If index is passed, then the component is a child of a listview or kanban
    The structure will be - 
          components: {
            componentId: {
              0: {
                styles: {},
                properties: {},
            }
          }
    If it is null, then the structure will be - 
          components: {
            componentId: {
              styles: {},
              properties: {},
          }
  */
    setResolvedComponentByProperty: (componentId, type, property, value, index = null, moduleId = 'canvas') => {
      value = get().debugger.validateProperty(componentId, type, property, value, moduleId);

      set(
        (state) => {
          if (!state.resolvedStore.modules[moduleId]) {
            state.resolvedStore.modules[moduleId] = { components: {} };
          }

          if (!state.resolvedStore.modules[moduleId].components[componentId]) {
            state.resolvedStore.modules[moduleId].components[componentId] = { ...DEFAULT_COMPONENT_STRUCTURE };
          }

          if (index !== null) {
            const indices = Array.isArray(index) ? index : [index];

            // Helper function to recursively unwrap nested arrays to get the component object
            const unwrapToObject = (val) => {
              let result = val;
              while (result && Array.isArray(result)) {
                result = result[0];
              }
              return result && typeof result === 'object' ? result : null;
            };

            // Ensure root is an array (modify state directly, not a local variable)
            if (!Array.isArray(state.resolvedStore.modules[moduleId].components[componentId])) {
              const existing = state.resolvedStore.modules[moduleId].components[componentId];
              const unwrapped = unwrapToObject(existing);
              state.resolvedStore.modules[moduleId].components[componentId] = unwrapped ? [unwrapped] : [];
            }

            // Navigate/create nested arrays for all but the last index
            // We keep track of parent references to ensure we can fix the state structure
            let current = state.resolvedStore.modules[moduleId].components[componentId];
            for (let i = 0; i < indices.length - 1; i++) {
              const idx = indices[i];
              if (!current[idx]) {
                current[idx] = [];
              } else if (!Array.isArray(current[idx])) {
                // Transition from flat to nested: wrap existing resolved component in array
                const unwrapped = unwrapToObject(current[idx]);
                current[idx] = unwrapped ? [unwrapped] : [];
              }
              current = current[idx];
            }

            const lastIdx = indices[indices.length - 1];

            // Get or create the component object at lastIdx
            let componentObj = unwrapToObject(current[lastIdx]);
            if (!componentObj) {
              // Try to copy structure from index 0 as fallback
              const source = unwrapToObject(current[0]);
              componentObj = source ? { ...source } : { ...DEFAULT_COMPONENT_STRUCTURE };
            } else {
              // Make a shallow copy to avoid mutating the original directly
              // This ensures Immer properly tracks the changes
              componentObj = { ...componentObj };
            }

            // Ensure we have the type object
            if (!componentObj[type]) {
              componentObj[type] = {};
            } else {
              componentObj[type] = { ...componentObj[type] };
            }

            // Set the property
            componentObj[type][property] = value;

            // Write back to state (this replaces any stale array structure)
            current[lastIdx] = componentObj;
          } else {
            // index is null — component is not inside a ListView/Kanban
            // If the stored data is still an array (stale from a previous parent), reset it
            if (Array.isArray(state.resolvedStore.modules[moduleId].components[componentId])) {
              state.resolvedStore.modules[moduleId].components[componentId] = { ...DEFAULT_COMPONENT_STRUCTURE };
            }
            state.resolvedStore.modules[moduleId].components[componentId][type] = {
              ...state.resolvedStore.modules[moduleId].components[componentId][type],
              [property]: value,
            };
          }
        },
        false,
        {
          type: 'setResolvedComponentByProperty',
          payload: {
            componentId,
            type,
            property,
            value,
            index,
            moduleId,
          },
        }
      );
    },
    /** Batched sibling of setResolvedComponentByProperty — one set() call for
     *  N row updates instead of N separate calls (perf: avoids N re-render
     *  triggers for e.g. a 1000-row Table write-back). Single-level row
     *  scoping only (index must be a scalar per update) — matches the worker
     *  engine's own lack of nested-array (ListView-in-ListView) modeling. */
    setResolvedComponentByPropertyBatch: (componentId, type, property, updates, moduleId = 'canvas') => {
      const validated = updates.map(({ index, value }) => ({
        index,
        value: get().debugger.validateProperty(componentId, type, property, value, moduleId),
      }));

      set(
        (state) => {
          if (!state.resolvedStore.modules[moduleId]) {
            state.resolvedStore.modules[moduleId] = { components: {} };
          }
          if (!state.resolvedStore.modules[moduleId].components[componentId]) {
            state.resolvedStore.modules[moduleId].components[componentId] = { ...DEFAULT_COMPONENT_STRUCTURE };
          }

          const unwrapToObject = (val) => {
            let result = val;
            while (result && Array.isArray(result)) {
              result = result[0];
            }
            return result && typeof result === 'object' ? result : null;
          };

          if (!Array.isArray(state.resolvedStore.modules[moduleId].components[componentId])) {
            const existing = state.resolvedStore.modules[moduleId].components[componentId];
            const unwrapped = unwrapToObject(existing);
            state.resolvedStore.modules[moduleId].components[componentId] = unwrapped ? [unwrapped] : [];
          }

          const arr = state.resolvedStore.modules[moduleId].components[componentId];

          for (const { index, value } of validated) {
            let componentObj = unwrapToObject(arr[index]);
            if (!componentObj) {
              const source = unwrapToObject(arr[0]);
              componentObj = source ? { ...source } : { ...DEFAULT_COMPONENT_STRUCTURE };
            } else {
              componentObj = { ...componentObj };
            }
            if (!componentObj[type]) {
              componentObj[type] = {};
            } else {
              componentObj[type] = { ...componentObj[type] };
            }
            componentObj[type][property] = value;
            arr[index] = componentObj;
          }
        },
        false,
        { type: 'setResolvedComponentByPropertyBatch', payload: { componentId, type, property, updates, moduleId } }
      );
    },
    /** Direct assignment for the non-component cascade targets (canvas
     *  background color, page-sidebar visibility) — the `others.<key>`
     *  shape applyDependencyUpdate's `type === undefined` branch writes.
     *  No validation, mirrors what that branch already does today. */
    setResolvedOtherByKey: (key, value, moduleId = 'canvas') => {
      set(
        (state) => {
          if (!state.resolvedStore.modules[moduleId].others) {
            state.resolvedStore.modules[moduleId].others = {};
          }
          state.resolvedStore.modules[moduleId].others[key] = value;
        },
        false,
        { type: 'setResolvedOtherByKey', payload: { key, value, moduleId } }
      );
    },
    setExposedValue: (componentId, property, value, moduleId = 'canvas') => {
      const existing = get().resolvedStore.modules[moduleId].exposedValues.components?.[componentId]?.[property];
      if (existing !== undefined && _.isEqual(existing, value)) return;

      const mutation = buildExposedValueMutation(componentId, property, value, moduleId);
      const depPaths = typeof value !== 'function' ? [{ path: `components.${componentId}.${property}`, moduleId }] : [];

      if (_exposedValueBatch.isBatching()) {
        _exposedValueBatch.bufferMutation(mutation, depPaths);
        return;
      }

      set(mutation, false, { type: 'setExposedValue', payload: { componentId, property, value, moduleId } });
      depPaths.forEach(({ path }) => scheduleDependencyUpdate(path, moduleId));
    },

    setExposedValues: (id, type, values, moduleId = 'canvas') => {
      // `existing` is the currently committed exposed-value object for the `component`
      const existing = get().resolvedStore.modules[moduleId].exposedValues[type][id];

      // "Collect writes and dependency paths only for keys that are an actual change. A key is skipped when:
      //   - it's a function (setValue/clear etc. are action handlers, never dependency sources), or
      //   - its value deep-equals the currently resolved value — re-publishing an unchanged value
      //     (e.g. a component re-emitting its default on mount/reload) must not count as a change,
      //     otherwise queries with "Run on dependency change" fire on app load.
      // When `existing` is undefined (first publish) or an array (stale ListView structure) there's
      // no comparable prior value, so every non-function key counts as changed.
      const writes = [];
      const depPaths = [];

      Object.entries(values).forEach(([key, value]) => {
        const isFunction = typeof value === 'function';
        const unchanged = existing !== undefined && !Array.isArray(existing) && _.isEqual(value, existing[key]);

        if (!isFunction && unchanged) return;
        writes.push([key, value]);

        if (!isFunction) depPaths.push({ path: `components.${id}.${key}`, moduleId });
      });

      if (writes.length === 0) return;

      // Replaces a missing entry, or a stale array (Immer can't set named keys on an array), with a fresh object before assigning each changed key.
      const mutation = (state) => {
        const entities = state.resolvedStore.modules[moduleId].exposedValues[type];
        writes.forEach(([key, value]) => {
          if (entities[id] === undefined || Array.isArray(entities[id])) {
            // Initialize as plain object. The Array.isArray check handles the case where a
            // component was previously inside a ListView (exposed values stored as a per-row
            // array) and is moved to the canvas — the stale array must be replaced with a
            // plain object before setting named properties, otherwise Immer throws because
            // arrays only support numeric indices.
            entities[id] = { [key]: value };
          } else {
            entities[id][key] = value;
          }
        });
      };

      if (_exposedValueBatch.isBatching()) {
        _exposedValueBatch.bufferMutation(mutation, depPaths);
        return;
      }

      set(mutation, false, { type: 'setExposedValues', payload: { id, type, values, moduleId } });
      depPaths.forEach(({ path }) => scheduleDependencyUpdate(path, moduleId));
    },

    setDefaultExposedValues: (id, parentId, componentType, moduleId = 'canvas') => {
      const val = get().resolvedStore.modules[moduleId].exposedValues.components[id];
      if (val && Object.keys(val).length > 0) return;
      const component = componentTypeDefinitionMap[componentType];
      if (!component) return;
      // Skip only if there is a Listview ancestor — those components use per-row array storage.
      // Form children without a Listview ancestor are now pre-populated by batchSetDefaultExposedValues
      // and will hit the early-return above, so this path is a safety net for non-pre-populated cases.
      if (parentId) {
        let cur = get().getComponentDefinition(parentId, moduleId);
        while (cur) {
          if (ROW_SCOPED_WIDGET_TYPES.includes(cur.component.component)) return;
          cur = get().getComponentDefinition(cur.component.parent, moduleId);
        }
      }
      const exposedVariables = component.exposedVariables || {};
      get().setExposedValues(id, 'components', exposedVariables, moduleId);
      get().rebuildComponentHints(moduleId);
    },

    updateCustomResolvables: (componentId, data, key, moduleId = 'canvas', parentIndices = []) => {
      const { updateDependencyValues, updateChildComponentsLength, invalidateContextHintsCache } = get();
      set((state) => {
        if (parentIndices.length === 0) {
          state.resolvedStore.modules[moduleId].customResolvables[componentId] = data;
        } else {
          // Store as nested structure indexed by outer indices
          if (!state.resolvedStore.modules[moduleId].customResolvables[componentId]) {
            state.resolvedStore.modules[moduleId].customResolvables[componentId] = {};
          }
          let current = state.resolvedStore.modules[moduleId].customResolvables[componentId];
          for (let i = 0; i < parentIndices.length - 1; i++) {
            if (!current[parentIndices[i]]) {
              current[parentIndices[i]] = {};
            }
            current = current[parentIndices[i]];
          }
          current[parentIndices[parentIndices.length - 1]] = data;
        }
      });
      updateChildComponentsLength(componentId, data.length, data, moduleId, parentIndices);
      updateDependencyValues(`components.${componentId}.${key}`, moduleId, parentIndices);
      invalidateContextHintsCache();
    },

    // Lazy variant of updateCustomResolvables -
    // stores data without triggering updateChildComponentsLength or updateDependencyValues.
    // Currently used by Table expandable rows so that resolution is deferred until a row is actually expanded.
    updateCustomResolvablesLazy: (componentId, data, moduleId = 'canvas', parentIndices = []) => {
      const { invalidateContextHintsCache } = get();
      set((state) => {
        if (parentIndices.length === 0) {
          state.resolvedStore.modules[moduleId].customResolvables[componentId] = data;
        } else {
          if (!state.resolvedStore.modules[moduleId].customResolvables[componentId]) {
            state.resolvedStore.modules[moduleId].customResolvables[componentId] = {};
          }
          let current = state.resolvedStore.modules[moduleId].customResolvables[componentId];
          for (let i = 0; i < parentIndices.length - 1; i++) {
            if (!current[parentIndices[i]]) {
              current[parentIndices[i]] = {};
            }
            current = current[parentIndices[i]];
          }
          current[parentIndices[parentIndices.length - 1]] = data;
        }
        // Mark as lazy so resolution guards in componentsSlice scope to expanded rows only
        state.resolvedStore.modules[moduleId].lazyResolvableParents[componentId] = true;
      });
      invalidateContextHintsCache();
    },

    updateChildComponentsLength: (parentId, length, data = [], moduleId = 'canvas', parentIndices = []) => {
      const { getContainerChildrenMapping, copyResolvedDataFromFirstIndex } = get();
      const childComponents = getContainerChildrenMapping(parentId, moduleId);
      if (parentIndices.length === 0) {
        // Flat case: set length and copy (existing behavior — kept as single set to preserve
        // the length-check optimization inside copyResolvedDataFromFirstIndex)
        set((state) => {
          childComponents.forEach((componentId) => {
            // Ensure component is an array (might be object if transitioning from non-ListView parent)
            if (!Array.isArray(state.resolvedStore.modules[moduleId].components[componentId])) {
              state.resolvedStore.modules[moduleId].components[componentId] = [];
            }
            state.resolvedStore.modules[moduleId].components[componentId].length = length;
            copyResolvedDataFromFirstIndex(componentId, parentId, data, moduleId);
          });
        });
      } else {
        // Nested case: do everything in ONE set() to avoid nested set() overwrite issues
        set((state) => {
          childComponents.forEach((componentId) => {
            if (!Array.isArray(state.resolvedStore.modules[moduleId].components[componentId])) {
              state.resolvedStore.modules[moduleId].components[componentId] = [];
            }
            let current = state.resolvedStore.modules[moduleId].components[componentId];
            for (let i = 0; i < parentIndices.length - 1; i++) {
              if (!current[parentIndices[i]]) {
                current[parentIndices[i]] = [];
              } else if (!Array.isArray(current[parentIndices[i]])) {
                current[parentIndices[i]] = [current[parentIndices[i]]];
              }
              current = current[parentIndices[i]];
            }
            const lastIdx = parentIndices[parentIndices.length - 1];
            if (!current[lastIdx]) {
              current[lastIdx] = [];
            } else if (!Array.isArray(current[lastIdx])) {
              current[lastIdx] = [current[lastIdx]];
            }
            const nested = current[lastIdx];
            nested.length = length;

            // Populate entries: use nested[0] as template, or fall back to sibling[0]
            let template = nested[0];
            if (!template) {
              // Look for a template from a sibling index that was already set up
              const sibling = current[0];
              template = Array.isArray(sibling) ? sibling[0] : sibling;
            }
            for (let i = 0; i < length; i++) {
              if (!nested[i]) {
                nested[i] = template ? { ...template } : { ...DEFAULT_COMPONENT_STRUCTURE };
              }
            }
          });
        });
      }
    },

    copyResolvedDataFromFirstIndex: (componentId, parentId, data = [], moduleId = 'canvas') => {
      const dataLength = get().getCustomResolvables(parentId, null, moduleId).length ?? data.length;
      if (get().resolvedStore.modules[moduleId]['components'][componentId].length === dataLength) return;
      set((state) => {
        for (let i = 0; i < dataLength; i++) {
          if (!state.resolvedStore.modules[moduleId]['components'][componentId][i])
            state.resolvedStore.modules[moduleId]['components'][componentId][i] = {
              ...state.resolvedStore.modules[moduleId]['components'][componentId][0],
            };
        }
      });
    },

    getCustomResolvables: (componentId, index = null, moduleId = 'canvas', parentIndices = []) => {
      // Strip any row suffix (e.g., 'listview-0' -> 'listview') to get the actual ListView/Kanban ID
      const baseComponentId = get().getBaseParentId?.(componentId) || componentId;
      let base = get().resolvedStore.modules[moduleId].customResolvables?.[baseComponentId] || {};
      // Navigate through parentIndices to reach the correct nested level
      for (let i = 0; i < parentIndices.length; i++) {
        base = base?.[parentIndices[i]];
        if (!base) return index !== null ? {} : {};
      }
      if (index !== null) {
        return base?.[index] || {};
      }
      return base || {};
    },

    getResolvedComponent: (componentId, subContainerIndex = null, moduleId = 'canvas') => {
      if (subContainerIndex !== null) {
        const indices = Array.isArray(subContainerIndex) ? subContainerIndex : [subContainerIndex];
        let current = get().resolvedStore?.modules?.[moduleId]?.components?.[componentId];
        for (let i = 0; i < indices.length; i++) {
          // If current is not an array, it's a resolved component leaf — stop navigating
          if (!Array.isArray(current)) break;
          const value = current?.[indices[i]];
          if (value !== undefined) {
            current = value;
          } else {
            // Fallback: use index 0 at this level and continue
            current = current?.[0];
            if (current === undefined) break;
          }
        }
        return current;
      }
      const data = get().resolvedStore?.modules?.[moduleId]?.components?.[componentId];
      // If index is null but data is still an array (stale from a previous ListView parent), return [0] as fallback
      if (Array.isArray(data)) {
        return data[0];
      }
      return data;
    },
    getExposedValueOfComponent: (componentId, moduleId = 'canvas') => {
      try {
        const components = get().getCurrentPageComponents(moduleId);
        const {
          component: { parent: parentId, name: componentName },
        } = components[componentId];
        if (parentId) {
          // if parent is form get exposed values from children
          const { component: parentComopnent } = components?.[parentId] || {};
          if (parentComopnent?.component === 'Form') {
            return (
              get().resolvedStore.modules[moduleId].exposedValues.components[parentId].children[componentName] || {}
            );
          }
        }
        return get().resolvedStore.modules[moduleId].exposedValues.components[componentId] || {};
      } catch (error) {
        return {};
      }
    },
    getExposedValueOfQuery: (queryId, moduleId = 'canvas') => {
      return get().resolvedStore.modules[moduleId].exposedValues.queries[queryId] || {};
    },
    // Phase 4 (ListView lazy resolution): getAllExposedValues is the single
    // chokepoint nearly every {{ }} expression resolves through (properties,
    // queries, events, page variables — see the resolver chokepoint
    // investigation in the Phase 4 doc). Wrapping ListView entries' own
    // `children`/`data` here — ephemerally, never persisted — is what lets
    // `{{components.listview1.children[50000].text1.text}}` resolve
    // correctly for a row that has never mounted AND never been eagerly
    // filled, without paying an O(rowCount) cost anywhere. A persisted Proxy
    // isn't possible here: Immer (this store's middleware) clones/drafts any
    // object it touches on every set(), which would collapse a persistent
    // lazy Proxy into a plain snapshot the first time any sibling row
    // writes. So the Proxy is built fresh on every call and discarded after
    // one resolution — cheap, because it only intercepts access to KNOWN
    // ListView component ids' `children`/`data` keys; every other read
    // passes straight through with no wrapping at all.
    // `raw: true` (used by engineBridge.ts's ResolutionEngine seeding, which
    // `_.cloneDeep`s the result — cloning a Proxy breaks it) skips the
    // wrapper and returns the live object directly.
    getAllExposedValues: (moduleId = 'canvas', { raw = false } = {}) => {
      const exposedValues = get().resolvedStore.modules[moduleId].exposedValues;
      if (raw) return exposedValues;
      return { ...exposedValues, components: get()._wrapExposedComponentsForLazyListviewRead(moduleId) };
    },
    // Builds the ephemeral, never-persisted Proxy described above. Kept as
    // its own action (not inlined) so listViewComponentSlice's row-build
    // helper stays the single source of truth for "what does row i's
    // definition-derived data look like" — this only decides WHEN to call it.
    //
    // getAllExposedValues is called MANY times per resolution cascade (once
    // per property/binding, often well before the next set() applies any
    // result) — rebuilding a fresh Proxy tree on every single call added
    // real overhead across the WHOLE app, not just ListView resolutions.
    // Cache the Proxy (and its row memo) per moduleId, keyed on the identity
    // of the underlying `components` object: Immer gives that object a new
    // reference only when a set() actually mutates something under it, so
    // this cache is valid for every call in between — which is exactly the
    // common case (a cascade resolving N properties against one snapshot).
    _wrapExposedComponentsForLazyListviewRead: (moduleId) => {
      const components = get().resolvedStore.modules[moduleId].exposedValues.components;
      const cached = _lazyComponentsProxyCache.get(moduleId);
      if (cached && cached.componentsRef === components) return cached.wrapped;

      const rowMemo = new Map(); // `${listviewId}|${kind}|${rowIndex}` -> value, invalidated whenever `components` itself changes
      const wrapRows = (rowsObj, listviewId, kind) =>
        new Proxy(rowsObj || {}, {
          get(target, key, receiver) {
            if (typeof key === 'string' && /^\d+$/.test(key)) {
              if (Object.prototype.hasOwnProperty.call(target, key)) return target[key];
              const memoKey = `${listviewId}|${kind}|${key}`;
              if (rowMemo.has(memoKey)) return rowMemo.get(memoKey);
              const {
                getContainerChildrenMapping,
                _buildListviewRowData,
                ensureListviewRowsResolved,
                isLazyResolvableParent,
              } = get();
              const rowIndex = Number(key);
              // If this ListView is lazy-resolvable (see updateCustomResolvablesLazy)
              // and this row's PROPERTIES have never been resolved (not just its
              // exposed values — a separate, earlier layer), resolve them now,
              // synchronously, before building Bucket A from them. Without this,
              // an off-screen row outside the currently-tracked lazy set would
              // read stale/fallback properties (getResolvedComponent's own
              // missing-index fallback returns row 0's data) instead of its own.
              // Skipped entirely for non-lazy ListViews (nested/dynamic-height/
              // grid/edit-mode) — their properties are already fully resolved
              // eagerly, so this would just be a redundant cascade trigger.
              if (isLazyResolvableParent(listviewId, moduleId)) {
                ensureListviewRowsResolved(listviewId, [rowIndex], moduleId, []);
              }
              const childIds = getContainerChildrenMapping(listviewId, moduleId);
              const rowData = _buildListviewRowData(childIds, [], rowIndex, moduleId);
              const value =
                Object.keys(rowData).length === 0
                  ? undefined
                  : kind === 'data'
                  ? removeFunctionObjects(deepClone(rowData))
                  : rowData;
              rowMemo.set(memoKey, value);
              return value;
            }
            return Reflect.get(target, key, receiver);
          },
        });
      // wrapListviewEntry/the outer components wrapper below build PLAIN
      // object copies, not Proxies. Immer freezes the underlying state
      // (non-configurable, non-writable properties) — the Proxy spec
      // requires a `get` trap to return the EXACT SAME value as the target
      // for such a property, never a substitute. Swapping in a wrapped
      // Proxy for `components[listviewId]` or `entry.children`/`entry.data`
      // violated that invariant and threw
      // "'get' on proxy: property '...' is a read-only and non-configurable
      // data property..." the moment anything did a strict enumeration of
      // it (e.g. Object.entries, used by the Inspector's useIconList). A
      // freshly-built plain object isn't frozen and isn't the target, so
      // there's no invariant to violate — only wrapRows (below) stays a real
      // Proxy, and it only ever substitutes a value for a row index that
      // DOESN'T exist on the target yet, which the invariant doesn't cover.
      const wrapListviewEntry = (entry, listviewId) => {
        // Nested ListView-in-ListView (entry is an array of outer rows) isn't
        // covered yet — same scope limitation as the proactive-fill work
        // this replaces. Falls through to whatever's already persisted.
        if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return entry;
        return {
          ...entry,
          children: wrapRows(entry.children, listviewId, 'children'),
          data: wrapRows(entry.data, listviewId, 'data'),
        };
      };
      const wrapped = { ...components };
      for (const key of Object.keys(components)) {
        if (get().getComponentTypeFromId(key, moduleId) === 'Listview') {
          wrapped[key] = wrapListviewEntry(components[key], key);
        }
      }
      _lazyComponentsProxyCache.set(moduleId, { componentsRef: components, wrapped });
      return wrapped;
    },
    getResolvedValue: (value, customVariables = {}, moduleId = 'canvas') => {
      if (typeof value === 'string' && value.includes('{{') && value.includes('}}')) {
        const re = extractAndReplaceReferencesFromString(
          value,
          get().modules[moduleId].componentNameIdMapping,
          get().modules[moduleId].queryNameIdMapping
        );

        let result = resolveDynamicValues(
          re.valueWithBrackets,
          get().resolvedStore.modules[moduleId].exposedValues,
          customVariables,
          false,
          []
        );
        return result;
      } else {
        return value;
      }
    },

    getCanvasBackgroundColor: (moduleId = 'canvas', darkMode) => {
      const globalSettingsBackgroundColor = get().globalSettings.canvasBackgroundColor;
      const canvasBgColor = get().globalSettings.backgroundFxQuery
        ? get().resolvedStore.modules[moduleId].others.canvasBackgroundColor || globalSettingsBackgroundColor
        : globalSettingsBackgroundColor;
      const canvasBackgroundColor = canvasBgColor ? canvasBgColor : 'var(--cc-appBackground-surface)';
      if (['#2f3c4c', '#edeff5'].includes(canvasBackgroundColor)) {
        return darkMode ? '#2f3c4c' : '#edeff5';
      }
      return canvasBackgroundColor;
    },

    getSecrets: (moduleId = 'canvas') => {
      return get().resolvedStore.modules[moduleId].secrets;
    },

    getPagesSidebarVisibility: (moduleId = 'canvas') => {
      // Tells whether the navigation items are visible or not (main header can still be visible due to app logo and title)
      return get().resolvedStore.modules[moduleId].others.isPagesSidebarHidden;
    },

    getPagesVisibility: (moduleId = 'canvas', id) => {
      return get().resolvedStore.modules[moduleId].others.pages[id]?.hidden ?? false;
    },

    setResolvedValueForOthers: (values, moduleId = 'canvas') => {
      set((state) => {
        state.resolvedStore.modules[moduleId].others = {
          ...state.resolvedStore.modules[moduleId].others,
          ...values,
        };
      });
    },

    resetExposedValues: (moduleId = 'canvas', { resetConstants = true, resetGlobals = true }) => {
      set((state) => {
        state.resolvedStore.modules[moduleId].components = {};
        state.resolvedStore.modules[moduleId].customResolvables = {};
        state.resolvedStore.modules[moduleId].lazyResolvableParents = {};
        state.resolvedStore.modules[moduleId].lazyRowIndices = {};
        state.resolvedStore.modules[moduleId].exposedValues.queries = {};
        state.resolvedStore.modules[moduleId].exposedValues.components = {};
        state.resolvedStore.modules[moduleId].exposedValues.variables = {};
        state.resolvedStore.modules[moduleId].exposedValues.globals = {};
        if (state.resolvedStore.modules[moduleId].exposedValues.input) {
          state.resolvedStore.modules[moduleId].exposedValues.input = {};
        }
        if (state.resolvedStore.modules[moduleId].exposedValues.page?.variables) {
          state.resolvedStore.modules[moduleId].exposedValues.page.variables = {};
        }
        if (resetConstants) {
          state.resolvedStore.modules[moduleId].exposedValues.constants = {};
        }
        if (resetGlobals) {
          state.resolvedStore.modules[moduleId].exposedValues.globals = {};
        }
        // state.resolvedStore.modules[moduleId] = {
        //   components: {},
        //   customResolvables: {},
        //   exposedValues: {
        //     queries: {},
        //     components: {},
        //     variables: {},
        //     constants: {
        //       ...get().resolvedStore.modules[moduleId].exposedValues.constants,
        //     },
        //     globals: {},
        //     page: {
        //       variables: {},
        //     },
        //   },
        // };
      });
    },

    // this function simply replaces the id with name for queries and components inside resolvedStore
    getResolvedState: (moduleId = 'canvas', key) => {
      const state = {
        components: {},
        queries: {},
      };

      const addToState = (source, mapping, targetKey) => {
        const reverseMapping = Object.fromEntries(Object.entries(mapping).map(([name, id]) => [id, name]));
        Object.entries(source).forEach(([k, v]) => {
          state[targetKey][reverseMapping[k] || k] = v;
        });
      };

      const exposedValues = get().resolvedStore.modules[moduleId].exposedValues;

      if (!key || ['all', 'components'].includes(key)) {
        addToState(exposedValues.components || {}, get().modules[moduleId].componentNameIdMapping, 'components');
      }

      if (!key || ['all', 'queries'].includes(key)) {
        addToState(exposedValues.queries || {}, get().modules[moduleId].queryNameIdMapping, 'queries');
      }

      if (!key || (key + '').trim() === 'all') {
        return { ...exposedValues, ...state };
      }
      return state;
    },

    resolveReferences: (
      moduleId = 'canvas',
      object,
      _state,
      defaultValue,
      customObjects = {},
      withError = false,
      forPreviewBox = false
    ) => {
      if (object === '{{{}}}') return '';

      object = _.clone(object);
      const objectType = typeof object;
      let error;

      const state = _state ?? get().getAllExposedValues(moduleId);

      if (_state?.parameters) {
        state.parameters = { ..._state.parameters };
      }

      switch (objectType) {
        case 'string': {
          return get().getResolvedValue(object, customObjects, moduleId);
        }

        case 'object': {
          if (Array.isArray(object)) {
            const new_array = [];

            object.forEach((element, index) => {
              const resolved_object = get().resolveReferences(moduleId, element, state);
              new_array[index] = resolved_object;
            });

            if (withError) return [new_array, error];
            return new_array;
          } else if (!_.isEmpty(object)) {
            Object.keys(object).forEach((key) => {
              const resolved_object = get().resolveReferences(moduleId, object[key], state);
              object[key] = resolved_object;
            });
            if (withError) return [object, error];
            return object;
          }
        }
        // eslint-disable-next-line no-fallthrough
        default: {
          if (withError) return [object, error];
          return object;
        }
      }
    },

    setModuleInputs: (key, value, moduleId = 'canvas') => {
      set(
        (state) => {
          if (!state.resolvedStore.modules[moduleId].exposedValues.input) {
            state.resolvedStore.modules[moduleId].exposedValues.input = {};
          }
          state.resolvedStore.modules[moduleId].exposedValues.input[key] = value;
        },
        false,
        'setModuleInputs'
      );
      get().updateDependencyValues(`input.${key}`, moduleId);
    },
    setModuleOutputs: (key, value, moduleId = 'canvas') => {
      set(
        (state) => {
          if (!state.resolvedStore.modules[moduleId].exposedValues.output) {
            state.resolvedStore.modules[moduleId].exposedValues.output = {};
          }
          state.resolvedStore.modules[moduleId].exposedValues.output[key] = value;
        },
        false,
        'setModuleOutputs'
      );
      get().updateDependencyValues(`output.${key}`, moduleId);
    },
    clearModuleInputs: (moduleId = 'canvas') => {
      set((state) => {
        state.resolvedStore.modules[moduleId].exposedValues.input = {};
      });
    },
    clearModuleOutputs: (moduleId = 'canvas') => {
      set((state) => {
        state.resolvedStore.modules[moduleId].exposedValues.output = {};
      });
    },

    // Cleans up all lazy resolution state for a component (customResolvables, lazyResolvableParents, lazyRowIndices)
    cleanupLazyResolvables: (componentId, moduleId = 'canvas') => {
      set((state) => {
        const mod = state.resolvedStore.modules[moduleId];
        delete mod.customResolvables[componentId];
        delete mod.lazyResolvableParents[componentId];
        delete mod.lazyRowIndices[componentId];
      });
    },

    isLazyResolvableParent: (componentId, moduleId = 'canvas') =>
      !!get().resolvedStore.modules[moduleId].lazyResolvableParents?.[componentId],

    getLazyRowIndices: (componentId, moduleId = 'canvas', includeZero = false) => {
      const indices = get().resolvedStore.modules[moduleId].lazyRowIndices?.[componentId] || [];
      if (includeZero && !indices.includes(0)) return [0, ...indices];
      return indices;
    },
  };
};
