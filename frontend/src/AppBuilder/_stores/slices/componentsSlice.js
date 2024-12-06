import { appVersionService } from '@/_services';
import { componentTypes } from '@/AppBuilder/WidgetManager';
import {
  resolveDynamicValues,
  // extractAndReplaceReferencesFromString,
  checkSubstringRegex,
  hasArrayNotation,
  parsePropertyPath,
} from '@/AppBuilder/_stores/utils';
import { extractAndReplaceReferencesFromString } from '@/AppBuilder/_stores/ast';
import { deepClone } from '@/_helpers/utilities/utils.helpers';
import { cloneDeep, merge, set as lodashSet } from 'lodash';
import { computeComponentName, getAllChildComponents } from '@/AppBuilder/AppCanvas/appCanvasUtils';
import { pageConfig } from '@/AppBuilder/RightSideBar/PageSettingsTab/pageConfig';
import { RIGHT_SIDE_BAR_TAB } from '@/AppBuilder/RightSideBar/rightSidebarConstants';
import { DEFAULT_COMPONENT_STRUCTURE } from './resolvedSlice';
import { savePageChanges } from './pageMenuSlice';
import { toast } from 'react-hot-toast';
import { restrictedWidgetsObj } from '@/AppBuilder/WidgetManager/configs/restrictedWidgetsConfig';
import moment from 'moment';
import { getDateTimeFormat } from '@/AppBuilder/Widgets/Table/Datepicker';

// TODO: page id to index mapping to be created and used across the state for current page access
const initialState = {
  modules: {
    canvas: {
      pages: [],
      componentNameIdMapping: {},
      queryNameIdMapping: {},
      queryIdNameMapping: {},
    },
  },
  currentPageId: null,
  currentPageIndex: 0,
  containerChildrenMapping: {
    canvas: [],
  },
  selectedComponents: [],
  currentPageHandle: null,
  showWidgetDeleteConfirmation: false,
};

export const createComponentsSlice = (set, get) => ({
  ...initialState,

  setPages: (pages = [], moduleId = 'canvas') => {
    set(
      (state) => {
        state.modules[moduleId].pages = Object.freeze(pages);
      },
      false,
      'setPages'
    );
  },

  setPageSettings: (pageSettings = {}, moduleId) => {
    set(
      (state) => {
        state.pageSettings = pageSettings;
      },
      false,
      'setPageSettings'
    );
  },

  setCurrentPageId: (id, moduleId) =>
    set(
      (state) => {
        const currentPageIndex = state.modules.canvas.pages.findIndex((page) => page.id === id);
        const currentPageComponents = state.modules[moduleId].pages[currentPageIndex]?.components || {};
        state.currentPageIndex = currentPageIndex;
        state.currentPageId = id;
        state.containerChildrenMapping = { canvas: [] };
        Object.entries(currentPageComponents).forEach(([componentId, component]) => {
          const parentId = component.component.parent || 'canvas';
          if (!state.containerChildrenMapping[parentId]) {
            state.containerChildrenMapping[parentId] = [];
          }
          state.containerChildrenMapping[parentId].push(componentId);
        });
      },
      false,
      'setCurrentPageId'
    ),
  setCurrentPageHandle: (handle) => {
    set(
      (state) => {
        state.currentPageHandle = handle;
      },
      false,
      'setCurrentPageHandle'
    );
  },

  updateComponentDependencyGraph: (moduleId, newComponent) => {
    const { addNewComponentNameIdMapping, addToDependencyGraph, setResolvedComponent } = get();

    addNewComponentNameIdMapping(newComponent.id, newComponent.name, moduleId);

    // const dependencyGraph = { ...modules[moduleId].dependencyGraph };

    const resolvedComponentValues = addToDependencyGraph(moduleId, newComponent.id, newComponent.component);
    setResolvedComponent(newComponent.id, resolvedComponentValues, moduleId);

    set(
      (state) => {
        state.modules[moduleId].dependencyGraph = { ...state.modules[moduleId].dependencyGraph };
      },
      false,
      'updateComponentDependencyGraph'
    );
  },

  addNewComponentNameIdMapping: (componentId, componentName, moduleId = 'canvas') => {
    set(
      (state) => {
        state.modules[moduleId].componentNameIdMapping[componentName] = componentId;
      },
      false,
      'addNewComponentNameIdMapping'
    );
    get().checkAndSetTrueBuildSuggestionsFlag();
  },

  renameComponentNameIdMapping: (oldName, newName, moduleId = 'canvas') => {
    set((state) => {
      state.modules[moduleId].componentNameIdMapping[newName] = state.modules[moduleId].componentNameIdMapping[oldName];
      delete state.modules[moduleId].componentNameIdMapping[oldName];
    });
    get().checkAndSetTrueBuildSuggestionsFlag();
  },

  deleteComponentNameIdMapping: (componentName, moduleId = 'canvas') => {
    set(
      (state) => {
        delete state.modules[moduleId].componentNameIdMapping[componentName];
      },
      false,
      'deleteComponentNameIdMapping'
    );
    get().checkAndSetTrueBuildSuggestionsFlag();
  },

  setComponentNameIdMapping: (moduleId = 'canvas') => {
    const components = get().getCurrentPageComponents();
    set(
      (state) => {
        Object.entries(components).forEach(([componentId, component]) => {
          state.modules[moduleId].componentNameIdMapping[component.component.name] = componentId;
        });
      },
      false,
      'setComponentNameIdMapping'
    );
  },

  setComponentName: (componentId, newName, moduleId = 'canvas') => {
    const { renameComponentNameIdMapping, saveComponentChanges } = get();
    let oldName = '';
    set(
      (state) => {
        oldName = state.modules[moduleId].pages[state.currentPageIndex].components[componentId].component.name;
        state.modules[moduleId].pages[state.currentPageIndex].components[componentId].component.name = newName;
      },
      false,
      'setComponentName'
    );

    const diff = {
      [componentId]: { component: { name: newName } },
    };

    saveComponentChanges(diff, 'components', 'update');
    renameComponentNameIdMapping(oldName, newName, moduleId);
  },

  setQueryMapping: (moduleId = 'canvas') => {
    const queries = get().dataQuery.getCurrentModuleQueries(moduleId);
    set((state) => {
      Object.values(queries).forEach(({ id, name }) => {
        state.modules[moduleId].queryNameIdMapping = {
          ...state.modules[moduleId].queryNameIdMapping,
          [name]: id,
        };
        state.modules[moduleId].queryIdNameMapping[id] = name;
      });
    });
  },

  addNewQueryMapping: (queryId, queryName, moduleId = 'canvas') => {
    set(
      (state) => {
        state.modules[moduleId].queryNameIdMapping[queryName] = queryId;
        state.modules[moduleId].queryIdNameMapping[queryId] = queryName;
      },
      false,
      'addNewQueryMapping'
    );
  },
  clearSelectedComponents: () => set({ selectedComponents: [] }, false, 'clearSelectedComponents'),

  renameQueryMapping: (oldName, newName, queryId, moduleId = 'canvas') => {
    set((state) => {
      state.modules[moduleId].queryNameIdMapping[newName] = state.modules[moduleId].queryNameIdMapping[oldName];
      delete state.modules[moduleId].queryNameIdMapping[oldName];
      state.modules[moduleId].queryIdNameMapping[queryId] = newName;
    });
    get().checkAndSetTrueBuildSuggestionsFlag();
  },

  deleteQueryMapping: (queryName, queryId, moduleId = 'canvas') => {
    set(
      (state) => {
        delete state.modules[moduleId].queryNameIdMapping[queryName];
        delete state.modules[moduleId].queryIdNameMapping[queryId];
      },
      false,
      'deleteQueryMapping'
    );
    get().checkAndSetTrueBuildSuggestionsFlag();
  },

  generateDependencyGraphForRefs: (allRefs, key, paramType, property, unResolvedValue, isUpdate = false) => {
    const { addDependency, updateDependency } = get();
    if (allRefs.length !== 0) {
      allRefs.forEach(({ entityType, entityNameOrId, entityKey }, index) => {
        const propertyValue = entityNameOrId
          ? `${entityType}.${entityNameOrId}.${entityKey}`
          : `${entityType}.${entityKey}`;
        const propertyPath = paramType === undefined ? `others.${key}` : `components.${key}.${paramType}.${property}`;
        if (isUpdate && index === 0) {
          updateDependency(propertyValue, propertyPath, unResolvedValue);
        } else {
          addDependency(propertyValue, propertyPath, unResolvedValue);
        }
      });
    }
  },

  updateResolvedValues: (
    componentId,
    paramType,
    property,
    value,
    component,
    componentResolvedValues = {},
    updatePassedValue = true,
    moduleId
  ) => {
    const {
      getCustomResolvableReference,
      checkIfParentIsListviewOrKanban,
      getCustomResolvables,
      setAllValueToComponent,
    } = get();
    let customResolvables = {};
    const parentId = component?.parent;
    const componentDetails = { componentId, paramType, property };
    let index = checkIfParentIsListviewOrKanban(parentId, moduleId) ? 0 : null;
    if (index !== null) {
      customResolvables = getCustomResolvables(parentId, null);
    }
    if (typeof value === 'string' && value?.includes('{{') && value?.includes('}}')) {
      let valueWithId, allRefs, valueWithBrackets;
      if (value === '{{true}}' || value === '{{false}}') {
        valueWithId = value;
        valueWithBrackets = value;
        allRefs = [];
      } else {
        const res = extractAndReplaceReferencesFromString(
          value,
          get().modules[moduleId].componentNameIdMapping,
          get().modules[moduleId].queryNameIdMapping
        );
        valueWithId = res.valueWithId;
        valueWithBrackets = res.valueWithBrackets;
        allRefs = res.allRefs;
      }
      if (index !== null) {
        const customResolvablePath = getCustomResolvableReference(value, parentId, moduleId);
        if (customResolvablePath) {
          allRefs.push(customResolvablePath);
        }
      }
      if (updatePassedValue)
        setAllValueToComponent(
          componentDetails,
          valueWithBrackets,
          true,
          index,
          customResolvables,
          componentResolvedValues,
          moduleId
        );

      return { updatedValue: valueWithId, allRefs, unResolvedValue: valueWithBrackets, componentResolvedValues };
    } else {
      if (updatePassedValue)
        setAllValueToComponent(
          componentDetails,
          value,
          false,
          index,
          customResolvables,
          componentResolvedValues,
          moduleId
        );
    }
    return { updatedValue: value, allRefs: [], unResolvedValue: value, componentResolvedValues };
  },

  setAllValueToComponent: (
    componentDetails,
    value,
    shouldResolve = false,
    index,
    customResolvables,
    componentResolvedValues = {},
    moduleId
  ) => {
    const { getAllExposedValues, getComponentTypeFromId } = get();
    const { componentId, paramType, property } = componentDetails;
    const length = Object.keys(customResolvables).length;
    if (length === 0) {
      const resolvedValue = shouldResolve
        ? resolveDynamicValues(value, getAllExposedValues(), customResolvables, false, [])
        : value;
      if (!componentResolvedValues[componentId] || Object.keys(componentResolvedValues[componentId]).length === 0) {
        componentResolvedValues[componentId] = index === null ? deepClone(DEFAULT_COMPONENT_STRUCTURE) : [];
      }
      if (index !== null) {
        if (!componentResolvedValues[componentId][index]) {
          componentResolvedValues[componentId][index] = deepClone(DEFAULT_COMPONENT_STRUCTURE);
        }
        if (!componentResolvedValues[componentId][index][paramType]) {
          componentResolvedValues[componentId][index][paramType] = {};
        }
        if (hasArrayNotation(property)) {
          const keys = parsePropertyPath(property);
          lodashSet(
            componentResolvedValues,
            [componentId, index, paramType, ...keys],
            getComponentTypeFromId(componentId) === 'Table' ? value : resolvedValue
          );
        } else {
          componentResolvedValues[componentId][index][paramType][property] = resolvedValue;
        }
      } else {
        if (!componentResolvedValues[componentId][paramType]) {
          componentResolvedValues[componentId][paramType] = {};
        }

        if (hasArrayNotation(property)) {
          const keys = parsePropertyPath(property);
          lodashSet(
            componentResolvedValues,
            [componentId, paramType, ...keys],
            getComponentTypeFromId(componentId) === 'Table' ? value : resolvedValue
          );
        } else {
          componentResolvedValues[componentId][paramType][property] = resolvedValue;
        }
      }
    } else {
      // Loop all the index and set the resolved value
      for (let i = 0; i < length; i++) {
        const resolvedValue = shouldResolve
          ? resolveDynamicValues(value, getAllExposedValues(), customResolvables[i], false, [])
          : value;
        if (!componentResolvedValues[componentId] || Object.keys(componentResolvedValues[componentId]).length === 0) {
          componentResolvedValues[componentId] = [];
        }
        if (!componentResolvedValues[componentId][i]) {
          componentResolvedValues[componentId][i] =
            i === 0 ? deepClone(DEFAULT_COMPONENT_STRUCTURE) : deepClone(componentResolvedValues[componentId][0]);
        }
        if (!componentResolvedValues[componentId][i][paramType]) {
          componentResolvedValues[componentId][i][paramType] = {};
        }
        componentResolvedValues[componentId][i][paramType][property] = resolvedValue;
      }
    }
  },

  setValueToComponent: (
    componentId,
    paramType,
    property,
    parentId,
    value,
    unResolvedValue,
    skipResolve = false,
    moduleId
  ) => {
    const {
      setResolvedComponentByProperty,
      getAllExposedValues,
      getCustomResolvables,
      checkIfParentIsListviewOrKanban,
    } = get();

    let customResolvables = {},
      shouldResolve = false;
    let index = checkIfParentIsListviewOrKanban(parentId, moduleId) ? 0 : null;
    if (index !== null) {
      customResolvables = getCustomResolvables(parentId, null);
    }

    if (
      typeof unResolvedValue === 'string' &&
      unResolvedValue?.includes('{{') &&
      unResolvedValue?.includes('}}') &&
      !skipResolve
    ) {
      shouldResolve = true;
    }

    const length = Object.keys(customResolvables).length;
    if (length === 0) {
      const resolvedValue = shouldResolve
        ? resolveDynamicValues(unResolvedValue, getAllExposedValues(), customResolvables, false, [])
        : value;
      setResolvedComponentByProperty(componentId, paramType, property, resolvedValue, index, moduleId);
    } else {
      // Loop all the index and set the resolved value
      for (let i = 0; i < length; i++) {
        const resolvedValue = shouldResolve
          ? resolveDynamicValues(unResolvedValue, getAllExposedValues(), customResolvables[i], false, [])
          : value;
        setResolvedComponentByProperty(componentId, paramType, property, resolvedValue, i, moduleId);
      }
    }
  },

  validateWidget: ({ validationObject, widgetValue, customResolveObjects }) => {
    const { getResolvedValue } = get();
    let isValid = true;
    let validationError = null;

    const regex = validationObject?.regex?.value ?? validationObject?.regex;
    const minLength = validationObject?.minLength?.value ?? validationObject?.minLength;
    const maxLength = validationObject?.maxLength?.value ?? validationObject?.maxLength;
    const minValue = validationObject?.minValue?.value ?? validationObject?.minValue;
    const maxValue = validationObject?.maxValue?.value ?? validationObject?.maxValue;
    const customRule = validationObject?.customRule?.value ?? validationObject?.customRule;
    const mandatory = validationObject?.mandatory?.value ?? validationObject?.mandatory;
    let validationRegex = getResolvedValue(regex, customResolveObjects) ?? '';
    validationRegex = typeof validationRegex === 'string' ? validationRegex : '';
    const re = new RegExp(validationRegex, 'g');

    if (!re.test(widgetValue)) {
      return {
        isValid: false,
        validationError: 'The input should match pattern',
      };
    }

    const resolvedMinLength = getResolvedValue(minLength, customResolveObjects) || 0;
    if ((widgetValue || '').length < parseInt(resolvedMinLength)) {
      return {
        isValid: false,
        validationError: `Minimum ${resolvedMinLength} characters is needed`,
      };
    }

    const resolvedMaxLength = getResolvedValue(maxLength, customResolveObjects) || undefined;
    if (resolvedMaxLength !== undefined) {
      if ((widgetValue || '').length > parseInt(resolvedMaxLength)) {
        return {
          isValid: false,
          validationError: `Maximum ${resolvedMaxLength} characters is allowed`,
        };
      }
    }

    const resolvedMinValue = getResolvedValue(minValue, customResolveObjects) || undefined;
    if (resolvedMinValue !== undefined) {
      if (widgetValue === undefined || widgetValue < parseFloat(resolvedMinValue)) {
        return {
          isValid: false,
          validationError: `Minimum value is ${resolvedMinValue}`,
        };
      }
    }

    const resolvedMaxValue = getResolvedValue(maxValue, customResolveObjects) || undefined;
    if (resolvedMaxValue !== undefined) {
      if (widgetValue === undefined || widgetValue > parseFloat(resolvedMaxValue)) {
        return {
          isValid: false,
          validationError: `Maximum value is ${resolvedMaxValue}`,
        };
      }
    }

    const resolvedCustomRule = getResolvedValue(customRule, customResolveObjects) || false;
    if (typeof resolvedCustomRule === 'string' && resolvedCustomRule !== '') {
      return { isValid: false, validationError: resolvedCustomRule };
    }

    const resolvedMandatory = getResolvedValue(mandatory, customResolveObjects) || false;

    if (resolvedMandatory == true && !widgetValue) {
      return {
        isValid: false,
        validationError: `Field cannot be empty`,
      };
    }
    return {
      isValid,
      validationError,
    };
  },

  validateDates: ({ validationObject, widgetValue, customResolveObjects }) => {
    const { getResolvedValue } = get();
    let isValid = true;
    let validationError = null;
    const validationDateFormat = validationObject?.dateFormat?.value || 'MM/DD/YYYY';
    const validationTimeFormat = validationObject?.timeFormat?.value || 'HH:mm';
    const customRule = validationObject?.customRule?.value;
    const parsedDateFormat = validationObject?.parseDateFormat?.value;
    const isTwentyFourHrFormatEnabled = validationObject?.isTwentyFourHrFormatEnabled?.value ?? false;
    const isDateSelectionEnabled = validationObject?.isDateSelectionEnabled?.value ?? true;
    const _widgetDateValue = moment(widgetValue, parsedDateFormat);
    const _widgetTimeValue = moment(
      widgetValue,
      getDateTimeFormat(parsedDateFormat, true, isTwentyFourHrFormatEnabled, isDateSelectionEnabled)
    ).format(validationTimeFormat);

    const resolvedMinDate = getResolvedValue(validationObject?.minDate?.value, customResolveObjects) || undefined;
    const resolvedMaxDate = getResolvedValue(validationObject?.maxDate?.value, customResolveObjects) || undefined;
    const resolvedMinTime = getResolvedValue(validationObject?.minTime?.value, customResolveObjects) || undefined;
    const resolvedMaxTime = getResolvedValue(validationObject?.maxTime?.value, customResolveObjects) || undefined;

    // Minimum date validation
    if (resolvedMinDate !== undefined && moment(resolvedMinDate).isValid()) {
      if (!moment(resolvedMinDate, validationDateFormat).isBefore(moment(_widgetDateValue, validationDateFormat))) {
        return {
          isValid: false,
          validationError: `Minimum date is ${resolvedMinDate}`,
        };
      }
    }

    // Maximum date validation
    if (resolvedMaxDate !== undefined && moment(resolvedMaxDate).isValid()) {
      if (!moment(resolvedMaxDate, validationDateFormat).isAfter(moment(_widgetDateValue, validationDateFormat))) {
        return {
          isValid: false,
          validationError: `Maximum date is ${resolvedMaxDate}`,
        };
      }
    }

    // Minimum time validation
    if (resolvedMinTime !== undefined && moment(resolvedMinTime, validationTimeFormat, true).isValid()) {
      if (!moment(resolvedMinTime, validationTimeFormat).isBefore(moment(_widgetTimeValue, validationTimeFormat))) {
        return {
          isValid: false,
          validationError: `Minimum time is ${resolvedMinTime}`,
        };
      }
    }

    // Maximum time validation
    if (resolvedMaxTime !== undefined && moment(resolvedMaxTime, validationTimeFormat, true).isValid()) {
      if (!moment(resolvedMaxTime, validationTimeFormat).isAfter(moment(_widgetTimeValue, validationTimeFormat))) {
        return {
          isValid: false,
          validationError: `Maximum time is ${resolvedMaxTime}`,
        };
      }
    }

    //Custom rule validation
    const resolvedCustomRule = getResolvedValue(customRule, customResolveObjects) || false;
    if (typeof resolvedCustomRule === 'string' && resolvedCustomRule !== '') {
      return { isValid: false, validationError: resolvedCustomRule };
    }
    return {
      isValid,
      validationError,
    };
  },

  // This function checks whether the property value is an array or not and then resolves the value accordingly
  // Cases like Table column, Dropdown options, etc.
  checkValueAndResolve: (
    componentId,
    paramType,
    property,
    value,
    component,
    resolvedComponentValues,
    updatePassedValue = true,
    moduleId
  ) => {
    const { updateResolvedValues, generateDependencyGraphForRefs } = get();
    const updatedPropertyValue = cloneDeep(value);
    if (Array.isArray(value)) {
      value.forEach((val, index) => {
        //This code assumes that the array always consists of objects the else condition is to handle the case when the value is an array of strings/numbers
        if (val && typeof val === 'object') {
          Object.entries(val).forEach(([key, keyValue]) => {
            const propertyWithArrayValue = `${property}[${index}].${key}`;
            const keys = [key];
            if (keyValue?.value) {
              keys.push('value');
            }
            const { allRefs, unResolvedValue, updatedValue } = updateResolvedValues(
              componentId,
              paramType,
              propertyWithArrayValue,
              keyValue?.value ?? keyValue,
              component,
              resolvedComponentValues,
              updatePassedValue,
              moduleId
            );
            lodashSet(updatedPropertyValue, [index, ...keys], updatedValue);
            if (allRefs.length) {
              generateDependencyGraphForRefs(allRefs, componentId, paramType, propertyWithArrayValue, unResolvedValue);
            }
          });
        } else {
          const propertyWithArrayValue = `${property}[${index}]`;
          const { allRefs, unResolvedValue, updatedValue } = updateResolvedValues(
            componentId,
            paramType,
            propertyWithArrayValue,
            val,
            component,
            resolvedComponentValues,
            updatePassedValue,
            moduleId
          );
          updatedPropertyValue[index] = updatedValue;
          console.log('updatedPropertyValue', updatedPropertyValue);
          if (allRefs.length) {
            generateDependencyGraphForRefs(allRefs, componentId, paramType, propertyWithArrayValue, unResolvedValue);
          }
        }
      });
      return { updatedValue: updatedPropertyValue };
    } else {
      const { allRefs, unResolvedValue, updatedValue } = updateResolvedValues(
        componentId,
        paramType,
        property,
        value,
        component,
        resolvedComponentValues,
        updatePassedValue,
        moduleId
      );
      if (allRefs.length) {
        generateDependencyGraphForRefs(allRefs, componentId, paramType, property, unResolvedValue);
      }
      return { allRefs, unResolvedValue, updatedValue };
    }
  },

  updateDependencyGraphAndResolvedValues: (
    moduleId,
    componentId,
    component,
    componentType,
    resolvedComponentValues = {},
    paramType
  ) => {
    const { checkValueAndResolve, setAllValueToComponent } = get();
    if (component.definition[paramType] === undefined) return;
    Object.entries(component.definition[paramType]).forEach(([property, value]) => {
      if (!value?.skipResolve) {
        checkValueAndResolve(
          componentId,
          paramType,
          property,
          value?.value,
          component,
          resolvedComponentValues,
          true,
          moduleId
        );
      } else {
        const componentDetails = { componentId, paramType, property };
        setAllValueToComponent(componentDetails, value?.value, false, null, {}, resolvedComponentValues, moduleId);
      }
    });
  },

  addToDependencyGraph: (moduleId = 'canvas', componentId, component) => {
    const { updateDependencyGraphAndResolvedValues, getResolvedComponent } = get();
    //TODO: Replace with object of component types
    let resolvedComponentValues = { [componentId]: deepClone(getResolvedComponent(componentId) ?? {}) };
    const componentType = componentTypes.find((comp) => component.component === comp.component);
    ['properties', 'general', 'generalStyles', 'others', 'styles', 'validation'].forEach((key) => {
      updateDependencyGraphAndResolvedValues(
        moduleId,
        componentId,
        component,
        componentType,
        resolvedComponentValues,
        key
      );
    });
    return resolvedComponentValues[componentId];
  },

  initDependencyGraph: (moduleId) => {
    const { getCurrentPageComponents, addToDependencyGraph, setResolvedComponents, resolveOthers } = get();
    const components = getCurrentPageComponents();

    //TODO: Replace with object of component types
    let resolvedComponentValues = {};

    Object.entries(components).forEach(([componentId, component]) => {
      resolvedComponentValues[componentId] = addToDependencyGraph(moduleId, componentId, component.component);
    });
    setResolvedComponents(resolvedComponentValues, moduleId);
    resolveOthers(moduleId);
  },

  //It can be extended if any of the fx needs to be resolved dynamically outside components
  getOtherFieldsToBeResolved: (moduleId) => {
    return {
      canvasBackgroundColor: get().globalSettings.backgroundFxQuery,
      isPagesSidebarHidden: get().pageSettings?.properties?.disableMenu?.value,
    };
  },

  resolveOthers: (moduleId, isUpdate = false, otherObj) => {
    const {
      getOtherFieldsToBeResolved,
      getAllExposedValues,
      generateDependencyGraphForRefs,
      setResolvedValueForOthers,
    } = get();
    const items = otherObj || getOtherFieldsToBeResolved(moduleId);
    const resolvedValues = {};
    Object.entries(items).forEach(([key, item]) => {
      if (typeof item === 'string' && item?.includes('{{') && item?.includes('}}')) {
        const { allRefs, valueWithBrackets } = extractAndReplaceReferencesFromString(
          item,
          get().modules[moduleId].componentNameIdMapping,
          get().modules[moduleId].queryNameIdMapping
        );
        const resolvedValue = resolveDynamicValues(valueWithBrackets, getAllExposedValues(), {}, false, []);
        resolvedValues[key] = resolvedValue;
        generateDependencyGraphForRefs(allRefs, key, undefined, undefined, valueWithBrackets, isUpdate);
      } else {
        resolvedValues[key] = item;
      }
    });
    setResolvedValueForOthers(resolvedValues, moduleId);
  },
  canAddToParent: (parentId, currentWidget, moduleId = 'canvas') => {
    const { getComponentTypeFromId } = get();
    const transformedParentId = parentId?.length > 36 ? parentId.slice(0, 36) : parentId;
    let parentType = getComponentTypeFromId(transformedParentId, moduleId);
    const parentWidget = parentType === 'Kanban' ? 'Kanban_card' : parentType;
    const restrictedWidgets = restrictedWidgetsObj?.[parentWidget] || [];
    const isParentChangeAllowed = !restrictedWidgets.includes(currentWidget);
    if (!isParentChangeAllowed)
      toast.error(`${currentWidget} is not compatible as a child component of ${parentWidget}`);
    return isParentChangeAllowed;
  },
  addComponentToCurrentPage: (
    componentDefinitions,
    moduleId = 'canvas',
    { skipUndoRedo = false, saveAfterAction = true } = {}
  ) => {
    const {
      saveComponentChanges,
      withUndoRedo,
      updateComponentDependencyGraph,
      getCurrentPageComponents,
      canAddToParent,
      getComponentNameFromId,
      deleteComponentNameIdMapping,
    } = get();
    // This is made into a promise to wait for the saveComponentChanges to complete so that the caller can await it
    return new Promise((resolve) => {
      if (
        canAddToParent(
          componentDefinitions[0].component.parent,
          componentDefinitions[0].component.component,
          moduleId
        ) === false
      ) {
        return false;
      }
      const newComponents = componentDefinitions.reduce((acc, componentDefinition) => {
        const currentComponents = {
          ...getCurrentPageComponents(),
          ...Object.fromEntries(acc.map((component) => [component.id, component])),
        };
        const componentName =
          componentDefinition.name || computeComponentName(componentDefinition.component.component, currentComponents);
        const newComponent = {
          id: componentDefinition.id,
          name: componentName,
          component: {
            component: componentDefinition.component.component,
            definition: {
              general: componentDefinition.component.definition?.general,
              generalStyles: componentDefinition.component.definition?.generalStyles,
              others: componentDefinition.component.definition?.others,
              properties: componentDefinition.component.definition?.properties,
              styles: componentDefinition.component.definition?.styles,
              validation: componentDefinition.component.definition?.validation,
            },
            name: componentName,
            parent: componentDefinition.component.parent,
          },
          layouts: componentDefinition.layouts,
        };

        return [...acc, newComponent];
      }, []);

      const diff = newComponents.reduce((acc, newComponent) => {
        acc[newComponent.id] = {
          name: newComponent.name,
          layouts: newComponent.layouts,
          type: newComponent.component.component,
          ...newComponent.component.definition,
          parent: newComponent.component.parent,
        };
        return acc;
      }, {});

      newComponents.forEach((newComponent, index) => {
        // Have added this condition to delete the oldName from the mapping if it exists due to cut pasting multiple times
        const oldName = getComponentNameFromId(newComponent.id, moduleId);
        if (oldName) {
          deleteComponentNameIdMapping(oldName, moduleId);
        }
        updateComponentDependencyGraph(moduleId, newComponent);
        const parentId = newComponent.component.parent || 'canvas';
        set(
          withUndoRedo((state) => {
            if (!state.containerChildrenMapping[parentId]) {
              state.containerChildrenMapping[parentId] = [];
            }
            if (!state.containerChildrenMapping[parentId].includes(newComponent.id)) {
              state.containerChildrenMapping[parentId].push(newComponent.id);
            }
            const page = state.modules[moduleId].pages[state.currentPageIndex];
            page.components[newComponent.id] = newComponent;
          }, skipUndoRedo),
          false,
          'addComponentToCurrentPage'
        );
        if (index === 0) {
          //incase of multiple components, only first one will be selected since it will be the parent component
          get().setSelectedComponents([newComponent.id]);
        }
      });

      if (saveAfterAction) {
        saveComponentChanges(diff, 'components', 'create')
          .then(() => {
            resolve(); // Resolve the promise after all operations are complete
          })
          .catch((error) => {
            toast.error('App could not be saved.');
            console.error('Error saving component changes:', error);
          });
        get().multiplayer.broadcastUpdates(newComponents, 'components', 'create');
      }
    });
  },

  deleteComponents: (
    selected,
    moduleId = 'canvas',
    { skipUndoRedo = false, saveAfterAction = true, isCut = false } = {}
  ) => {
    const {
      saveComponentChanges,
      getCurrentPageComponents,
      withUndoRedo,
      selectedComponents,
      deleteComponentNameIdMapping,
      removeNode,
    } = get();
    const appEvents = get().eventsSlice.getModuleEvents(moduleId);
    const componentNames = [];
    const _selectedComponents = selected?.length ? selected : selectedComponents;
    if (!_selectedComponents.length) return;
    set(
      withUndoRedo((state) => {
        const toDeleteComponents = [];
        const toDeleteEvents = [];
        const allComponents = getCurrentPageComponents();

        const findAllChildComponents = (componentId) => {
          if (!toDeleteComponents.includes(componentId)) {
            toDeleteComponents.push(componentId);

            // Find the children of this component
            const children = getAllChildComponents(allComponents, componentId).map((child) => child.id);
            if (children.length > 0) {
              // Recursively find children of children
              children.forEach((child) => {
                findAllChildComponents(child);
              });
            }
          }
        };

        _selectedComponents.forEach((componentId) => {
          findAllChildComponents(componentId);
        });

        const page = state.modules.canvas.pages[state.currentPageIndex];
        const resolvedComponents = state.resolvedStore.modules?.[moduleId]?.components;
        const componentsExposedValues = state.resolvedStore.modules?.[moduleId]?.exposedValues.components;

        toDeleteComponents.forEach((id) => {
          // Remove from containerChildrenMapping
          Object.keys(state.containerChildrenMapping).forEach((containerId) => {
            state.containerChildrenMapping[containerId] = state.containerChildrenMapping[containerId].filter(
              (componentId) => componentId !== id
            );
          });

          // Remove the container itself if it's a container
          if (state.containerChildrenMapping[id]) {
            delete state.containerChildrenMapping[id];
          }
          if (state.containerChildrenMapping?.canvas?.includes(id)) {
            state.containerChildrenMapping.canvas = state.containerChildrenMapping.canvas.filter((wid) => wid !== id);
          }
          componentNames.push(page.components[id]?.component?.name);
          const eventsToRemove = appEvents.filter((event) => event.sourceId === id).map((event) => event.id);
          toDeleteEvents.push(...eventsToRemove);
          delete page.components[id]; // Remove the component from the page
          delete resolvedComponents[id]; // Remove the component from the resolved store
          delete componentsExposedValues[id]; // Remove the component from the exposed values
          state.selectedComponents = []; // Empty the selected components
          removeNode(`components.${id}`);
          state.showWidgetDeleteConfirmation = false; // Set it to false always
        });

        const filteredEvents = appEvents.filter((event) => !toDeleteEvents.includes(event.id));
        state.eventsSlice.module[moduleId].events = filteredEvents;

        if (saveAfterAction) {
          saveComponentChanges(toDeleteComponents, 'components', 'delete')
            .then(() => {
              get().multiplayer.broadcastUpdates({ selectedComponents: _selectedComponents }, 'components', 'delete');
              // Show delete toast message
              if (!isCut) {
                const platform = navigator?.userAgentData?.platform || navigator?.platform || 'unknown';
                const isMac = platform.toLowerCase().indexOf('mac') > -1;
                const deleteMsg =
                  toDeleteComponents.length && toDeleteComponents.length > 1
                    ? `Selected components deleted! ${isMac ? '(⌘ + Z to undo)' : '(Ctrl + Z to undo)'}`
                    : `Component deleted! ${isMac ? '(⌘ + Z to undo)' : '(Ctrl + Z to undo)'}`;
                toast(deleteMsg, {
                  icon: '🗑️',
                });
              }
            })
            .catch((error) => {
              toast.error('App could not be saved.');
              console.error('Error saving component changes:', error);
            });
        }
      }, skipUndoRedo),
      false,
      'deleteComponents'
    );
    componentNames.forEach((componentName) => {
      deleteComponentNameIdMapping(componentName);
    });
  },

  pasteComponents: async (components, moduleId = 'canvas') => {
    const { addComponentToCurrentPage, eventsSlice } = get();

    // Add the components to the current page and wait for it to complete
    await addComponentToCurrentPage(components, moduleId);

    // Now that components are added, handle the events
    for (const component of components) {
      const events = component.events || [];
      for (const event of events) {
        const newEvent = {
          event: {
            ...event?.event,
          },
          eventType: event?.target,
          attachedTo: component.id,
          index: event?.index,
        };
        await eventsSlice.createAppVersionEventHandlers(newEvent);
      }
    }
  },

  snapToGrid: (canvasWidth, x, y) => {
    const gridX = canvasWidth / 43;

    const snappedX = Math.round(x / gridX) * gridX;
    const snappedY = Math.round(y / 10) * 10;
    return [snappedX, snappedY];
  },

  setComponentLayout: (
    componentLayouts,
    newParentId,
    moduleId = 'canvas',
    { skipUndoRedo = false, updateParent = false, saveAfterAction = true } = {}
  ) => {
    const {
      saveComponentChanges,
      withUndoRedo,
      getComponentTypeFromId,
      setResolvedComponent,
      getComponentDefinition,
      currentLayout,
      checkValueAndResolve,
    } = get();
    let hasParentChanged = false;
    let oldParentId;
    set(
      withUndoRedo((state) => {
        const page = state.modules[moduleId].pages[state.currentPageIndex];
        if (page) {
          // ============ Component layout update logic ============
          Object.entries(componentLayouts).forEach(([componentId, layout]) => {
            const component = page.components[componentId];
            if (component) {
              component.layouts[currentLayout] = {
                ...component.layouts[currentLayout],
                ...layout,
              };
            }
            // ============ Component layout update logic ends ===========

            // ============ Parent update logic ============
            oldParentId = component.component.parent;
            hasParentChanged = oldParentId !== newParentId;
            if (hasParentChanged && updateParent) {
              // Update the component's parent
              component.component.parent = newParentId;
              // Remove the component from the old parent's children list
              if (oldParentId) {
                state.containerChildrenMapping[oldParentId] = state.containerChildrenMapping[oldParentId].filter(
                  (id) => id !== componentId
                );
              } else if (state.containerChildrenMapping.canvas.includes(componentId)) {
                state.containerChildrenMapping.canvas = state.containerChildrenMapping.canvas.filter(
                  (id) => id !== componentId
                );
              }

              // Add the component to the new parent's children list
              if (newParentId) {
                if (!state.containerChildrenMapping[newParentId]) {
                  state.containerChildrenMapping[newParentId] = [];
                }
                state.containerChildrenMapping[newParentId].push(componentId);
              } else {
                state.containerChildrenMapping.canvas.push(componentId);
              }
            }
            // ============ Parent update logic ends ============
          });
        }
      }, skipUndoRedo),
      false,
      'setComponentLayout'
    );

    Object.keys(componentLayouts).forEach((componentId) => {
      const newParentComponentType = getComponentTypeFromId(newParentId, moduleId);
      const oldParentComponentType = getComponentTypeFromId(oldParentId, moduleId);
      const { component } = getComponentDefinition(componentId, moduleId);

      if (
        newParentComponentType === 'Listview' ||
        newParentComponentType === 'Kanban' ||
        oldParentComponentType === 'Listview' ||
        oldParentComponentType === 'Kanban'
      ) {
        // Add the component to the resolved store
        let resolvedComponentValues = { [componentId]: {} };

        // Update resolved values and dependency graph for each object in the component
        const objectsToUpdate = ['properties', 'general', 'generalStyles', 'others', 'styles', 'validation'];

        objectsToUpdate.forEach((paramType) => {
          if (component.definition[paramType]) {
            Object.entries(component.definition[paramType]).forEach(([property, value]) => {
              checkValueAndResolve(
                componentId,
                paramType,
                property,
                value.value,
                component,
                resolvedComponentValues,
                true,
                moduleId
              );
            });
          }
        });
        setResolvedComponent(componentId, resolvedComponentValues[componentId], moduleId);
      }
    });

    const diff = Object.entries(componentLayouts).reduce((acc, [componentId, layout]) => {
      acc[componentId] = {
        ...(hasParentChanged && updateParent
          ? {
              component: {
                parent: newParentId,
              },
            }
          : {}),
        layouts: {
          [currentLayout]: {
            ...layout,
          },
        },
      };
      return acc;
    }, {});

    if (saveAfterAction) {
      saveComponentChanges(diff, 'components/layout', 'update');
      get().multiplayer.broadcastUpdates(diff, 'components/layout', 'update');
    }
  },

  setComponentProperty: (
    componentId,
    property,
    value,
    paramType,
    attr = 'value',
    skipResolve = false,
    moduleId = 'canvas',
    { skipUndoRedo = false, saveAfterAction = true } = {}
  ) => {
    const {
      currentPageIndex,
      saveComponentChanges,
      withUndoRedo,
      updateResolvedValues,
      generateDependencyGraphForRefs,
      removeDependency,
      getComponentDefinition,
      setValueToComponent,
      checkValueAndResolve,
      getResolvedComponent,
      setResolvedComponent,
    } = get();
    const { component } = getComponentDefinition(componentId, moduleId);
    const oldValue = component.definition[paramType][property];

    if (Array.isArray(oldValue?.value)) {
      const resolvedComponent = { [componentId]: deepClone(getResolvedComponent(componentId) ?? {}) };
      resolvedComponent[componentId][paramType][property] = [];

      const { updatedValue } = checkValueAndResolve(
        componentId,
        paramType,
        property,
        value,
        component,
        resolvedComponent,
        true,
        moduleId
      );
      setResolvedComponent(componentId, resolvedComponent[componentId], moduleId);

      // If the value is not changed, return
      if (oldValue?.[attr] === updatedValue || oldValue === updatedValue) return;

      set(
        withUndoRedo((state) => {
          const pageComponent = state.modules[moduleId].pages[currentPageIndex].components[componentId].component;
          lodashSet(pageComponent, ['definition', paramType, property, attr], updatedValue);
        }, skipUndoRedo),
        false,
        'setComponentProperty'
      );

      const oldComponent = get().modules[moduleId].pages[currentPageIndex].components[componentId].component;
      const { events, exposedVariables, ...filteredDefinition } = oldComponent.definition || {};

      const diff = {
        [componentId]: {
          component: {
            ...oldComponent,
            definition: filteredDefinition,
          },
        },
      };

      if (saveAfterAction) {
        const currentMode = get().currentMode;
        if (currentMode !== 'view') saveComponentChanges(diff, 'components', 'update');

        get().multiplayer.broadcastUpdates({ componentId, property, value, paramType, attr }, 'components', 'update');
      }
      return;
    }

    // Update the value and get new dependencies
    const { updatedValue, allRefs, unResolvedValue } =
      attr === 'value' && !skipResolve
        ? updateResolvedValues(componentId, paramType, property, value, component, null, false, moduleId)
        : { updatedValue: value, allRefs: [], unResolvedValue: value };

    // If the value is not changed, return
    if (oldValue?.[attr] === updatedValue || oldValue === updatedValue) return;

    set(
      withUndoRedo((state) => {
        const pageComponent = state.modules[moduleId].pages[currentPageIndex].components[componentId].component;
        lodashSet(pageComponent, ['definition', paramType, property, attr], updatedValue);
      }, skipUndoRedo),
      false,
      'setComponentProperty'
    );

    if (attr !== 'fxActive') {
      setValueToComponent(
        componentId,
        paramType,
        property,
        component?.parent,
        updatedValue,
        unResolvedValue,
        skipResolve,
        moduleId
      );
    }

    const oldComponent = get().modules[moduleId].pages[currentPageIndex].components[componentId].component;
    const { events, exposedVariables, ...filteredDefinition } = oldComponent.definition || {};

    const diff = {
      [componentId]: {
        component: {
          ...oldComponent,
          definition: filteredDefinition,
        },
      },
    };

    if (saveAfterAction) {
      const currentMode = get().currentMode;
      if (currentMode !== 'view') saveComponentChanges(diff, 'components', 'update');

      get().multiplayer.broadcastUpdates({ componentId, property, value, paramType, attr }, 'components', 'update');
    }

    if (attr !== 'value' || skipResolve) return;
    if (allRefs.length) {
      generateDependencyGraphForRefs(allRefs, componentId, paramType, property, unResolvedValue, true);
    } else {
      const propertyPath = `components.${componentId}.${paramType}.${property}`;
      removeDependency(propertyPath, true);
    }
  },

  //TO_DO : Remove this function
  setParentComponent: (
    componentId,
    newParentId,
    moduleId = 'canvas',
    { skipUndoRedo = false, saveAfterAction = true } = {}
  ) => {
    const {
      currentPageIndex,
      saveComponentChanges,
      checkValueAndResolve,
      getComponentDefinition,
      getComponentTypeFromId,
      setResolvedComponent,
      withUndoRedo,
    } = get();
    let oldParentId;
    set(
      withUndoRedo((state) => {
        const component = state.modules[moduleId].pages[currentPageIndex].components[componentId];
        oldParentId = component.component.parent;
        // Update the component's parent
        component.component.parent = newParentId;

        // Remove the component from the old parent's children list
        if (oldParentId) {
          state.containerChildrenMapping[oldParentId] = state.containerChildrenMapping[oldParentId].filter(
            (id) => id !== componentId
          );
        } else if (state.containerChildrenMapping.canvas.includes(componentId)) {
          state.containerChildrenMapping.canvas = state.containerChildrenMapping.canvas.filter(
            (id) => id !== componentId
          );
        }

        // Add the component to the new parent's children list
        if (newParentId) {
          if (!state.containerChildrenMapping[newParentId]) {
            state.containerChildrenMapping[newParentId] = [];
          }
          state.containerChildrenMapping[newParentId].push(componentId);
        } else {
          state.containerChildrenMapping.canvas.push(componentId);
        }
      }, skipUndoRedo),
      false,
      { type: 'setParentComponent', payload: { componentId, newParentId } }
    );

    const newParentComponentType = getComponentTypeFromId(newParentId, moduleId);
    const oldParentComponentType = getComponentTypeFromId(oldParentId, moduleId);

    if (
      newParentComponentType === 'Listview' ||
      newParentComponentType === 'Kanban' ||
      oldParentComponentType === 'Listview' ||
      oldParentComponentType === 'Kanban'
    ) {
      // Add the component to the resolved store
      const { component } = getComponentDefinition(componentId, moduleId);
      let resolvedComponentValues = { [componentId]: {} };

      // Update resolved values and dependency graph for each object in the component
      const objectsToUpdate = ['properties', 'general', 'generalStyles', 'others', 'styles', 'validation'];

      objectsToUpdate.forEach((paramType) => {
        if (component.definition[paramType]) {
          Object.entries(component.definition[paramType]).forEach(([property, value]) => {
            checkValueAndResolve(
              componentId,
              paramType,
              property,
              value.value,
              component,
              resolvedComponentValues,
              true,
              moduleId
            );
          });
        }
      });
      setResolvedComponent(componentId, resolvedComponentValues[componentId], moduleId);
    }

    const diff = {
      [componentId]: {
        component: {
          parent: newParentId,
        },
      },
    };

    if (saveAfterAction) {
      saveComponentChanges(diff, 'components', 'update');
      get().multiplayer.broadcastUpdates({ componentId, newParentId }, 'components', 'parent');
    }
  },
  setSelectedComponents: (components) => {
    get().togglePageSettingMenu(false);
    set(
      (state) => {
        state.selectedComponents = components;
        if (components.length === 1) {
          state.activeRightSideBarTab = RIGHT_SIDE_BAR_TAB.CONFIGURATION;
        }
      },
      false,
      { type: 'setSelectedComponents', payload: { components } }
    );
  },
  setSelectedComponentAsModal: (componentId, moduleId = 'canvas') => {
    set(
      (state) => {
        state.selectedComponents = [componentId];
        state.activeRightSideBarTab = RIGHT_SIDE_BAR_TAB.CONFIGURATION;
      },
      false,
      { type: 'setSelectedComponentAsModal', payload: { componentId } }
    );
  },
  saveComponentChanges: (diff, type, operation) => {
    set(
      (state) => {
        state.app.isSaving = true;
      },
      false,
      'setAppSavingChanges'
    );
    const {
      app: { appId },
      currentVersionId,
      currentPageId,
    } = get();

    return new Promise((resolve) => {
      appVersionService
        .autoSaveApp(
          appId,
          currentVersionId,
          diff,
          type,
          currentPageId,
          operation,
          false, // isUserSwitchedVersion
          false // isComponentCutProcess
        )
        .then((response) => {
          resolve(response);
        })
        .catch((error) => {
          toast.error('App could not be saved.');
          console.error('Error saving component changes:', error);
        })
        .finally(() => {
          set(
            (state) => {
              state.app.isSaving = false;
            },
            false,
            'setAppSavingChanges'
          );
        });
    });
  },

  handleCanvasContainerMouseUp: (e) => {
    const { selectedComponents, clearSelectedComponents, setActiveRightSideBarTab } = get();
    const selectedText = window.getSelection().toString();
    const isClickedOnSubcontainer =
      e.target.getAttribute('component-id') !== null && e.target.getAttribute('component-id') !== 'canvas';
    if (
      !isClickedOnSubcontainer &&
      ['rm-container', 'real-canvas', 'modal'].includes(e.target.id) &&
      selectedComponents.length &&
      !selectedText
    ) {
      clearSelectedComponents();
      setActiveRightSideBarTab(RIGHT_SIDE_BAR_TAB.COMPONENTS);
    }
  },

  turnOffAutoComputeLayout: async (moduleId = 'canvas') => {
    const { app, currentPageId, currentVersionId } = get();
    set(
      (state) => {
        state.modules[moduleId].pages[state.currentPageIndex].autoComputeLayout = false;
      },
      false,
      'turnOffAutoComputeLayout'
    );

    await savePageChanges(app.appId, currentVersionId, currentPageId, { autoComputeLayout: false });
  },
  setWidgetDeleteConfirmation: (value) => {
    set((state) => {
      state.showWidgetDeleteConfirmation = value;
    });
  },

  getCurrentPageId: () => get().currentPageId,

  getComponentsFromAllPages: () => {
    const { modules } = get();
    return Object.fromEntries(
      modules.canvas.pages.flatMap((page) =>
        Object.entries(page.components).map(([id, { component }]) => [id, component.name])
      )
    );
  },

  getCurrentPageComponents: () => {
    const { modules, currentPageId } = get();
    const currentPageIndex = modules.canvas.pages.findIndex((page) => page.id === currentPageId);
    return modules.canvas.pages[currentPageIndex]?.components || [];
  },

  getCurrentPageComponentIds: () => {
    const { pages, currentPageId, modules } = get();
    const currentPageIndex = modules.canvas.pages.findIndex((page) => page.id === currentPageId);
    return Object.keys(pages[currentPageIndex]?.components || {});
  },

  getCurrentPage: (moduleId = 'canvas') => {
    const { modules, currentPageId } = get();
    const currentPage = modules[moduleId].pages.find((page) => page.id === currentPageId);
    return currentPage;
  },

  // Get the component definition from the component id
  getComponentDefinition: (componentId, moduleId = 'canvas') => {
    const currentPage = get().modules[moduleId].pages.find((page) => page.id === get().currentPageId);
    return currentPage?.components[componentId];
  },

  getComponentIdFromName: (componentName, moduleId = 'canvas') => {
    const { modules } = get();
    return modules[moduleId].componentNameIdMapping[componentName];
  },
  // Get the component name from the component id
  getComponentNameFromId: (componentId, moduleId = 'canvas') => {
    const { modules, currentPageIndex } = get();
    return modules[moduleId].pages[currentPageIndex]?.components[componentId]?.component.name;
  },
  getComponentTypeFromId: (componentId, moduleId = 'canvas') => {
    const { modules, currentPageIndex } = get();
    return modules[moduleId].pages[currentPageIndex]?.components[componentId]?.component.component;
  },
  getComponentNameIdMapping: (moduleId = 'canvas') => {
    const { modules } = get();
    return modules[moduleId].componentNameIdMapping;
  },
  getComponentIdNameMapping: () => {
    const { getComponentNameIdMapping } = get();
    return Object.fromEntries(Object.entries(getComponentNameIdMapping()).map(([name, id]) => [id, name]));
  },
  getSelectedComponentsDefinition: () => {
    const { selectedComponents, getCurrentPageComponents } = get();
    const allComponents = getCurrentPageComponents();
    const _selected = [];
    for (let componentId of selectedComponents) {
      const component = {
        component: allComponents?.[componentId]?.component,
        layouts: allComponents?.[componentId]?.layouts,
        parent: allComponents?.[componentId]?.component?.parent,
        id: componentId,
      };
      _selected.push(component);
    }
    return _selected;
  },
  getSelectedComponents: () => {
    return get().selectedComponents;
  },
  getQueryNameIdMapping: (moduleId = 'canvas') => {
    const { modules } = get();
    return modules[moduleId].queryNameIdMapping;
  },
  getQueryIdNameMapping: (moduleId = 'canvas') => {
    const { modules } = get();
    return modules[moduleId].queryIdNameMapping;
  },
  getContainerChildrenMapping: (id) => {
    const { containerChildrenMapping } = get();
    return containerChildrenMapping[id] || [];
  },
  getChildComponents: (parentId, moduleId = 'canvas') => {
    const { getCurrentPageComponents } = get();
    const allComponents = getCurrentPageComponents();
    const childComponents = Object.entries(allComponents)
      .filter(([_, component]) => component.component.parent === parentId)
      .reduce((acc, [id, component]) => {
        acc[id] = { component };
        return acc;
      }, {});
    return childComponents;
  },
  updateDependencyValues: (path, moduleId = 'canvas') => {
    const {
      getAllExposedValues,
      getDependencies,
      getNodeData,
      getEntityResolvedValueLength,
      updateChildComponentResolvedValues,
      getComponentTypeFromId,
      getResolvedComponent,
    } = get();
    const dependecies = getDependencies(path, moduleId);
    if (dependecies?.length) {
      dependecies.forEach((dependency) => {
        const itemsLength = getEntityResolvedValueLength(dependency, moduleId);
        // If the component is depend on listView/Kanban then update all child components (0 to listItem length) with new value
        if (itemsLength) {
          updateChildComponentResolvedValues(dependency, path, itemsLength, moduleId);
        } else {
          const [entityType, entityId, type, ...keys] = dependency.split('.');
          const key = keys.join('.');
          const unResolvedValue = getNodeData(dependency);
          const resolvedValue = resolveDynamicValues(unResolvedValue, getAllExposedValues(), {}, false, []);

          if (type === undefined) {
            set(
              (state) => {
                // This will set the value for fx on canvas backgroundColor & page settings
                state.resolvedStore.modules[moduleId][entityType][entityId] = resolvedValue;
              },
              false,
              'updateDependencyValues'
            );
          } else {
            const shouldValidate = entityType === 'components' && entityId;
            const validatedValue = shouldValidate
              ? get().debugger.validateProperty(entityId, type, key, resolvedValue)
              : resolvedValue;

            // logic to handle the key like options[0].visible. It will resolve the visible directly and update the resolved store
            if (hasArrayNotation(key)) {
              const keys = parsePropertyPath(key);
              // Triggering a re-render of the table component if any of the dependent component is updated
              // This is done to calculate the callValues in the table component
              // Need to find a better way to handle this
              if (getComponentTypeFromId(entityId, moduleId) === 'Table') {
                set(
                  (state) => {
                    lodashSet(
                      state.resolvedStore.modules[moduleId][entityType][entityId],
                      ['properties', 'shouldRender'],
                      (getResolvedComponent(entityId)?.['properties']?.['shouldRender'] ?? 0) + 1
                    );
                  },
                  false,
                  'updateDependencyValues'
                );
              } else {
                set(
                  (state) => {
                    lodashSet(
                      state.resolvedStore.modules[moduleId][entityType][entityId],
                      [type, ...keys],
                      getComponentTypeFromId(entityId, moduleId) === 'Table' ? unResolvedValue + ' ' : validatedValue
                    );
                  },
                  false,
                  'updateDependencyValues'
                );
              }
            } else {
              set(
                (state) => {
                  state.resolvedStore.modules[moduleId][entityType][entityId][type][key] = validatedValue;
                },
                false,
                'updateDependencyValues'
              );
            }
          }
        }
      });
    }
  },
  computePageSettings: (moduleId, cb) => {
    try {
      const { pageSettings: currentPageSettings } = get();
      const pageSettingMeta = cloneDeep(pageConfig);
      const mergedSettings = merge({}, pageSettingMeta.definition, currentPageSettings);
      set((state) => {
        state.pageSettings = {
          ...pageConfig,
          definition: {
            ...mergedSettings,
          },
        };
      });
      if (cb) {
        cb(mergedSettings.properties.disableMenu.value);
      }
    } catch (error) {
      console.log(error);
      return Promise.reject(error);
    }
  },

  getParentIdFromDependency: (dependency) => {
    const { getComponentDefinition } = get();
    const componentId = dependency.split('.')[1];
    const component = getComponentDefinition(componentId);
    return component?.component?.parent;
  },

  updateChildComponentResolvedValues: (dependency, path, length, moduleId = 'canvas') => {
    const { getCustomResolvables, getNodeData, getAllExposedValues, getParentIdFromDependency } = get();
    const [entityType, entityId, type, key] = dependency.split('.');
    const parentId = getParentIdFromDependency(dependency);
    const unResolvedValue = getNodeData(dependency);

    // Loop through the customResolvables and update the resolved value
    for (let i = 0; i < length; i++) {
      const resolvedValue = resolveDynamicValues(
        unResolvedValue,
        getAllExposedValues(),
        getCustomResolvables(parentId, i, moduleId), // passing the parent ID and index to get the custom resolvables of the child
        false,
        []
      );
      // If the index is not in the resolved store then add it with first index data
      const shouldValidate = entityType === 'components' && entityId;
      const validatedValue = shouldValidate
        ? get().debugger.validateProperty(entityId, type, key, resolvedValue)
        : resolvedValue;

      set(
        (state) => {
          if (!state.resolvedStore.modules[moduleId][entityType][entityId][i])
            state.resolvedStore.modules[moduleId][entityType][entityId][i] = {
              ...state.resolvedStore.modules[moduleId][entityType][entityId][0],
              [type]: {
                ...(state.resolvedStore.modules[moduleId][entityType][entityId]?.[0]?.[type] || {}),
                [key]: validatedValue,
              },
            };
          else state.resolvedStore.modules[moduleId][entityType][entityId][i][type][key] = validatedValue;
        },
        false,
        'updateChildComponentResolvedValues'
      );
    }
  },

  getParentComponentType: (parentId, moduleId) => {
    if (!parentId) return null;
    const { modules, currentPageIndex } = get();
    // Remove the tab id or any other details from the parent id (ie, -modal, -calendar, -0 from parentId)
    const parentUUID = parentId.match(/([a-fA-F0-9-]{36})-(.+)/)?.[1] || parentId;
    const component = modules[moduleId].pages[currentPageIndex].components[parentUUID];
    if (!component) return null;

    return component.component.component;
  },

  // Return the length of the resolved value of the component
  getEntityResolvedValueLength: (dependency, moduleId = 'canvas') => {
    const { resolvedStore } = get();
    const [entityType, entityId, type, key] = dependency.split('.');
    const data = resolvedStore.modules[moduleId]?.[entityType]?.[entityId];
    if (typeof data === 'string') return undefined;
    return data?.length;
  },

  // Check if the value contains any customResolvables like listItem or cardData and return the entityType, entityNameOrId, entityKey
  getCustomResolvableReference: (value, parentId, moduleId) => {
    const { getParentComponentType } = get();
    const parentComponentType = getParentComponentType(parentId, moduleId);
    if (parentComponentType === 'Listview' && value.includes('listItem') && checkSubstringRegex(value, 'listItem')) {
      return { entityType: 'components', entityNameOrId: parentId, entityKey: 'listItem' };
    } else if (
      parentComponentType === 'Kanban' &&
      value.includes('cardData') &&
      checkSubstringRegex(value, 'cardData')
    ) {
      return { entityType: 'components', entityNameOrId: parentId, entityKey: 'cardData' };
    }
    return null;
  },

  checkIfParentIsListviewOrKanban: (parentId, moduleId) => {
    const { getParentComponentType } = get();
    const parentComponentType = getParentComponentType(parentId, moduleId);
    if (parentComponentType === 'Listview' || parentComponentType === 'Kanban') {
      return true;
    }
    return false;
  },

  replaceIdsWithName: (input, moduleId = 'canvas') => {
    const { getComponentsFromAllPages, getQueryIdNameMapping } = get();
    const mappings = {
      components: getComponentsFromAllPages(moduleId), // Getting components from all pages to avoid showing IDs on queries when the component is not on the current page
      queries: getQueryIdNameMapping(moduleId),
    };

    const regex =
      /(components|queries)(\??\.|\??\.?\[['"]?)([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})(['"]?\])?(\??\.|\[['"]?)([^\s:?[\]'"+\-&|]+)/g;

    return input.replace(regex, (match, category, prefix, id, suffix, optionalChaining, property) => {
      if (mappings[category] && mappings[category][id]) {
        let name;
        if (category === 'components') {
          name = mappings[category][id];
        } else {
          name = mappings[category][id];
        }

        // Reconstruct the string with the name instead of UUID
        let result = `${category}`;

        // Handle optional chaining at the beginning
        if (prefix.includes('?.')) {
          result += '?.';
        } else if (prefix.includes('.')) {
          result += '.';
        }

        // Handle bracket notation
        if (prefix.includes('[')) {
          result += `["${name}"]`;
        } else {
          result += name;
        }

        // Handle optional chaining after the name
        if (optionalChaining) {
          result += optionalChaining;
        }

        // Add the property if it exists
        if (property) {
          result += property;
        }

        return result;
      }
      return match; // Return the original match if no mapping is found
    });
  },
  calculateMoveableBoxHeightWithId: (componentId, currentLayout, stylesDefinition) => {
    const componentDefinition = get().getComponentDefinition(componentId);
    const layoutData = componentDefinition?.layouts?.[currentLayout];
    const componentType = componentDefinition?.component?.component;
    const label = componentDefinition?.component?.definition?.properties?.label;
    const getAllExposedValues = get().getAllExposedValues;
    // Early return for non input components
    if (
      !['TextInput', 'PasswordInput', 'NumberInput', 'DropdownV2', 'MultiselectV2', 'RadioButtonV2'].includes(
        componentType
      )
    ) {
      return layoutData?.height;
    }
    const { alignment = { value: null }, width = { value: null }, auto = { value: null } } = stylesDefinition ?? {};
    const resolvedLabel = label?.value?.length ?? 0;
    const resolvedWidth = resolveDynamicValues(width?.value + '', getAllExposedValues()) ?? 0;
    const resolvedAuto = resolveDynamicValues(auto?.value + '', getAllExposedValues()) ?? false;

    const resolvedAlignment =
      alignment.value === 'top' || alignment.value === 'side'
        ? alignment.value
        : resolveDynamicValues(alignment.value + '');
    let newHeight = layoutData?.height;

    if (alignment.value && resolvedAlignment === 'top') {
      if ((resolvedLabel > 0 && resolvedWidth > 0) || (resolvedAuto && resolvedWidth === 0 && resolvedLabel > 0)) {
        newHeight += 20;
      }
    }
    return newHeight;
  },
  getIsAutoMobileLayout: (moduleId = 'canvas') => {
    const { getCurrentPage } = get();
    const currentPage = getCurrentPage(moduleId);
    return currentPage?.autoComputeLayout;
  },
});
