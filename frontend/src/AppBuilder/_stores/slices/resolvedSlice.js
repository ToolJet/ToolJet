import { resolveDynamicValues } from '../utils';
import { extractAndReplaceReferencesFromString } from '@/AppBuilder/_stores/ast';
import { componentTypeDefinitionMap } from '@/AppBuilder/WidgetManager';
import _ from 'lodash';

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

export const createResolvedSlice = (set, get) => ({
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
  setResolvedGlobals: (objKey, values, moduleId = 'canvas') => {
    set(
      (state) => {
        // Handle object assignment
        if (!state.resolvedStore.modules[moduleId].exposedValues.globals[objKey]) {
          state.resolvedStore.modules[moduleId].exposedValues.globals[objKey] = {};
        }
        if (Object.keys(values).length === 0) {
          // Set an empty object
          state.resolvedStore.modules[moduleId].exposedValues.globals[objKey] = {};
        } else {
          // Handle nested object assignment
          Object.entries(values).forEach(([key, value]) => {
            state.resolvedStore.modules[moduleId].exposedValues.globals[objKey][key] = value;
          });
        }
      },
      false,
      'setResolvedGlobals'
    );
    Object.entries(values).forEach(() => {
      get().updateDependencyValues(`globals.${objKey}`, moduleId);
    });
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
    set(
      (state) => {
        state.resolvedStore.modules[moduleId].exposedValues.variables[key] = value;
      },
      false,
      'setVariables'
    );
    get().updateDependencyValues(`variables.${key}`, moduleId);
    get().checkAndSetTrueBuildSuggestionsFlag();
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
    get().checkAndSetTrueBuildSuggestionsFlag();
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
      if (['isLoading', 'data', 'rawData', 'request', 'response', 'responseHeaders', 'metadata'].includes(key)) {
        if (typeof value !== 'function') get().updateDependencyValues(`queries.${queryId}.${key}`, moduleId);
      }
    });
    // Flag to update the codehinter suggestions
    get().checkAndSetTrueBuildSuggestionsFlag();
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
  setExposedValue: (componentId, property, value, moduleId = 'canvas') => {
    set(
      (state) => {
        if (state.resolvedStore.modules[moduleId].exposedValues.components[componentId] === undefined)
          state.resolvedStore.modules[moduleId].exposedValues.components[componentId] = {
            [property]: value,
          };
        state.resolvedStore.modules[moduleId].exposedValues.components[componentId][property] = value;
      },
      false,
      {
        type: 'setExposedValue',
        payload: { componentId, property, value, moduleId },
      }
    );
    get().updateDependencyValues(`components.${componentId}.${property}`, moduleId);
  },

  setExposedValues: (id, type, values, moduleId = 'canvas') => {
    const skipKeys = new Set();
    set(
      (state) => {
        Object.entries(values).forEach(([key, value]) => {
          const existing = state.resolvedStore.modules[moduleId].exposedValues[type][id];
          if (existing === undefined || Array.isArray(existing)) {
            // Initialize as plain object. The Array.isArray check handles the case where a
            // component was previously inside a ListView (exposed values stored as a per-row
            // array) and is moved to the canvas — the stale array must be replaced with a
            // plain object before setting named properties, otherwise Immer throws because
            // arrays only support numeric indices.
            state.resolvedStore.modules[moduleId].exposedValues[type][id] = {
              [key]: value,
            };
          } else {
            // If the value is equal to the existing value, add the key to the skipKeys set and do not update it
            // using lodash's isEqual as the state is immer proxy and cannot be compared directly
            if (_.isEqual(value, existing[key])) {
              skipKeys.add(key);
            } else existing[key] = value;
          }
        });
      },
      false,
      {
        type: 'setExposedValues',
        payload: { id, type, values, moduleId },
      }
    );
    Object.entries(values).forEach(([key, value]) => {
      if (typeof value !== 'function' && !skipKeys.has(key))
        get().updateDependencyValues(`components.${id}.${key}`, moduleId);
    });
  },

  setDefaultExposedValues: (id, parentId, componentType, moduleId = 'canvas') => {
    const val = get().resolvedStore.modules[moduleId].exposedValues.components[id];
    if (val && Object.keys(val).length > 0) return;
    const component = componentTypeDefinitionMap[componentType];
    if (!component) return;
    const parentComponentType = get().getComponentDefinition(parentId, moduleId)?.component?.component;
    if (['Form', 'Listview'].includes(parentComponentType)) return;
    const exposedVariables = component.exposedVariables || {};
    get().setExposedValues(id, 'components', exposedVariables, moduleId);
  },

  updateCustomResolvables: (componentId, data, key, moduleId = 'canvas', parentIndices = []) => {
    const { updateDependencyValues, updateChildComponentsLength } = get();
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
          return get().resolvedStore.modules[moduleId].exposedValues.components[parentId].children[componentName] || {};
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
  getAllExposedValues: (moduleId = 'canvas') => {
    return get().resolvedStore.modules[moduleId].exposedValues;
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
            console.log({ key, object });
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
});
