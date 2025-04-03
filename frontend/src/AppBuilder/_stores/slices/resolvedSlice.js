import { resolveDynamicValues } from '../utils';
// import { extractAndReplaceReferencesFromString, resolveCode, resolveDynamicValues } from '../utils';
import { extractAndReplaceReferencesFromString } from '@/AppBuilder/_stores/ast';
import { componentTypeDefinitionMap } from '@/AppBuilder/WidgetManager';
import _ from 'lodash';
import {
  reservedKeyword,
  resolveString,
  removeNestedDoubleCurlyBraces,
  getDynamicVariables,
  resolveCode,
} from '@/_helpers/utils';

import { validateMultilineCode } from '@/_helpers/utility';

const initialState = {
  resolvedStore: {
    modules: {
      canvas: {
        others: {
          canvasBackgroundColor: null,
          isPagesSidebarHidden: false,
        },
        components: {},
        secrets: {},
        customResolvables: {},
        exposedValues: {
          queries: {},
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
      get().updateDependencyValues(`globals.${objKey}`);
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
      get().updateDependencyValues(`constants.${key}`);
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
      get().updateDependencyValues(`page.${key}`);
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
    get().updateDependencyValues(`variables.${key}`);
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
    get().removeNode(`variables.${key}`);
    get().updateDependencyValues(`variables.${key}`);
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
    get().updateDependencyValues(`page.variables.${key}`);
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
    get().removeNode(`page.variables.${key}`);
    get().updateDependencyValues(`page.variables.${key}`);
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

  setResolvedQuery: (queryId, details, moduleId = 'canvas') => {
    set(
      (state) => {
        state.resolvedStore.modules[moduleId].exposedValues.queries[queryId] = {
          ...state.resolvedStore.modules[moduleId]?.exposedValues?.queries?.[queryId],
          ...details,
        };
      },
      false,
      'setResolvedQuery'
    );

    Object.entries(details).forEach(([key, value]) => {
      if (['isLoading', 'data', 'rawData', 'request', 'response', 'responseHeaders', 'metadata'].includes(key)) {
        if (typeof value !== 'function') get().updateDependencyValues(`queries.${queryId}.${key}`);
      }
    });
    // Flag to update the codehinter suggestions
    get().checkAndSetTrueBuildSuggestionsFlag();
  },
  initialiseResolvedQuery(querIds, moduleId = 'canvas') {
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

    const validatedComponents = validateComponents(components);

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
    value = get().debugger.validateProperty(componentId, type, property, value);

    set(
      (state) => {
        if (!state.resolvedStore.modules[moduleId]) {
          state.resolvedStore.modules[moduleId] = { components: {} };
        }

        if (!state.resolvedStore.modules[moduleId].components[componentId]) {
          state.resolvedStore.modules[moduleId].components[componentId] = { ...DEFAULT_COMPONENT_STRUCTURE };
        }

        if (index !== null) {
          if (!Array.isArray(state.resolvedStore.modules[moduleId].components[componentId])) {
            state.resolvedStore.modules[moduleId].components[componentId] = [];
          }
          if (!state.resolvedStore.modules[moduleId].components[componentId][index]) {
            state.resolvedStore.modules[moduleId].components[componentId][index] = {
              ...state.resolvedStore.modules[moduleId].components[componentId][0],
            };
          }
          state.resolvedStore.modules[moduleId].components[componentId][index][type] = {
            ...state.resolvedStore.modules[moduleId].components[componentId][index][type],
            [property]: value,
          };
        } else {
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
    get().updateDependencyValues(`components.${componentId}.${property}`);
  },

  setExposedValues: (id, type, values, moduleId = 'canvas') => {
    set(
      (state) => {
        Object.entries(values).forEach(([key, value]) => {
          if (state.resolvedStore.modules[moduleId].exposedValues[type][id] === undefined)
            state.resolvedStore.modules[moduleId].exposedValues[type][id] = {
              [key]: value,
            };
          else state.resolvedStore.modules[moduleId].exposedValues[type][id][key] = value;
        });
      },
      false,
      {
        type: 'setExposedValues',
        payload: { id, type, values, moduleId },
      }
    );
    Object.entries(values).forEach(([key, value]) => {
      if (typeof value !== 'function') get().updateDependencyValues(`components.${id}.${key}`);
    });
  },

  setDefaultExposedValues: (id, parentId, componentType, moduleId = 'canvas') => {
    const val = get().resolvedStore.modules[moduleId].exposedValues.components[id];
    if (val && Object.keys(val).length > 0) return;
    const component = componentTypeDefinitionMap[componentType];
    if (!component) return;
    const parentComponentType = get().getComponentDefinition(parentId)?.component?.component;
    if (['Form', 'Listview'].includes(parentComponentType)) return;
    const exposedVariables = component.exposedVariables || {};
    get().setExposedValues(id, 'components', exposedVariables, moduleId);
  },

  updateCustomResolvables: (componentId, data, key, moduleId = 'canvas') => {
    const { updateDependencyValues, updateChildComponentsLength } = get();
    set((state) => {
      state.resolvedStore.modules[moduleId].customResolvables[componentId] = data;
    });
    updateChildComponentsLength(componentId, data.length, data, moduleId);
    updateDependencyValues(`components.${componentId}.${key}`, moduleId);
  },

  updateChildComponentsLength: (parentId, length, data = [], moduleId = 'canvas') => {
    const { getContainerChildrenMapping, copyResolvedDataFromFirstIndex } = get();
    const childComponents = getContainerChildrenMapping(parentId, moduleId);
    set((state) => {
      childComponents.forEach((componentId) => {
        state.resolvedStore.modules[moduleId].components[componentId].length = length;
        copyResolvedDataFromFirstIndex(componentId, parentId, data, moduleId);
      });
    });
  },

  copyResolvedDataFromFirstIndex: (componentId, parentId, data = [], moduleId = 'canvas') => {
    const dataLength = get().getCustomResolvables(parentId, moduleId).length ?? data.length;
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

  getCustomResolvables: (componentId, index = null, moduleId = 'canvas') => {
    if (index !== null) {
      return get().resolvedStore.modules[moduleId].customResolvables?.[componentId]?.[index] || {};
    }
    return get().resolvedStore.modules[moduleId].customResolvables?.[componentId] || {};
  },

  getResolvedComponent: (componentId, subContainerIndex = null, moduleId = 'canvas') => {
    if (subContainerIndex !== null) {
      const value = get().resolvedStore?.modules?.[moduleId]?.components?.[componentId]?.[subContainerIndex];
      if (value) return value;
      return get().resolvedStore?.modules?.[moduleId]?.components?.[componentId]?.[0]; // This is a fallback value for listView & Kanban
    }
    return get().resolvedStore?.modules?.[moduleId]?.components?.[componentId];
  },
  getExposedValueOfComponent: (componentId, moduleId = 'canvas') => {
    try {
      const components = get().getCurrentPageComponents();
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
    const canvasBackgroundColor = canvasBgColor ? canvasBgColor : '#edeff5';
    if (['#2f3c4c', '#edeff5'].includes(canvasBackgroundColor)) {
      return darkMode ? '#2f3c4c' : '#edeff5';
    }
    return canvasBgColor;
  },

  getSecrets: (moduleId = 'canvas') => {
    return get().resolvedStore.modules[moduleId].secrets;
  },

  getPagesSidebarVisibility: (moduleId = 'canvas') => {
    return get().resolvedStore.modules[moduleId].others.isPagesSidebarHidden;
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
  getResolvedState: (key, moduleId = 'canvas') => {
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
    moduleId,
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

    const state = _state ?? get().getAllExposedValues();

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
});
