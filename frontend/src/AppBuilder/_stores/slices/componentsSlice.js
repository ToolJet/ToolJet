import { appVersionService } from '@/_services';
import { componentTypes, componentTypeDefinitionMap } from '@/AppBuilder/WidgetManager';
import {
  resolveDynamicValues,
  checkSubstringRegex,
  hasArrayNotation,
  parsePropertyPath,
} from '@/AppBuilder/_stores/utils';
import { extractAndReplaceReferencesFromString } from '@/AppBuilder/_stores/ast';
import { deepClone } from '@/_helpers/utilities/utils.helpers';
import { cloneDeep, merge, set as lodashSet, isEmpty } from 'lodash';
import {
  computeComponentName,
  getDropTargetLabel,
  getAllChildComponents,
  getParentWidgetFromId,
  wouldCreateParentCycle,
} from '@/AppBuilder/AppCanvas/appCanvasUtils';
import { pageConfig } from '@/AppBuilder/RightSideBar/PageSettingsTab/pageConfig';
import { RIGHT_SIDE_BAR_TAB } from '@/AppBuilder/RightSideBar/rightSidebarConstants';
import { DEFAULT_COMPONENT_STRUCTURE } from './resolvedSlice';
import { savePageChanges } from './pageMenuSlice';
import { toast } from 'react-hot-toast';
import {
  RESTRICTED_WIDGETS_CONFIG,
  RESTRICTED_WIDGET_SLOTS_CONFIG,
} from '@/AppBuilder/WidgetManager/configs/restrictedWidgetsConfig';
import moment from 'moment';
import { getDateTimeFormat } from '@/_helpers/appUtils';
import { findHighestLevelofSelection } from '@/AppBuilder/AppCanvas/Grid/gridUtils';
import { INPUT_COMPONENTS_FOR_FORM } from '@/AppBuilder/RightSideBar/Inspector/Components/Form/constants';
import {
  TOP_ALIGNMENT_HEIGHT_INCREMENT,
  ROW_SCOPED_WIDGET_TYPES,
  NESTING_LEVEL_LIMITS,
} from '@/AppBuilder/AppCanvas/appCanvasConstants';
import { extractQueryReferences } from '@/AppBuilder/_utils/queryPanel';
import { createDefaultFlexChildLayout } from '@/AppBuilder/Widgets/FlexContainer/flexContainer.utils';

// ======================
// SECTION: Query re-run on dependency change
// ======================

// Debounce timers for query re-runs triggered by dependency changes
const queryRerunTimers = new Map();

// Modules whose initial-load / page-switch exposed-value flush is in progress.
// Dependency-triggered query re-runs for those modules are suppressed.
const suppressedQueryRerunModules = new Set();

// Debounce delay for dependency-triggered query re-runs.
// RunJS/RunPy are blocked at registerQueryDependencies and never reach here.
function scheduleQueryRerun(queryId, queryName, kind, moduleId, getStore) {
  // Skip re-runs cascading from the initial-load / page-switch settle for this module.
  if (suppressedQueryRerunModules.has(moduleId)) return;
  if (queryRerunTimers.has(queryId)) {
    clearTimeout(queryRerunTimers.get(queryId));
  }
  const delay = 500;
  const timerId = setTimeout(() => {
    queryRerunTimers.delete(queryId);
    const store = getStore();
    const query = store.dataQuery?.queries?.modules?.[moduleId]?.find((q) => q.id === queryId);
    if (query?.options?.runOnDependencyChange) {
      store.queryPanel.runQuery(queryId, queryName, undefined, undefined, {}, false, false, moduleId);
    }
  }, delay);
  queryRerunTimers.set(queryId, timerId);
}

/** Clear any pending rerun timer for a query (e.g., on deletion). */
export function clearQueryRerunTimer(queryId) {
  if (queryRerunTimers.has(queryId)) {
    clearTimeout(queryRerunTimers.get(queryId));
    queryRerunTimers.delete(queryId);
  }
}

/** Clear ALL pending rerun timers (e.g., on page switch). */
function clearAllQueryRerunTimers() {
  queryRerunTimers.forEach((timerId) => clearTimeout(timerId));
  queryRerunTimers.clear();
}

/** Suppress dependency-triggered query re-runs for a given module during initial-load or page-switch settle. */
export function setSuppressQueryRerun(moduleId, value) {
  if (value) suppressedQueryRerunModules.add(moduleId);
  else suppressedQueryRerunModules.delete(moduleId);
}

// ======================
// END SECTION: Query re-run on dependency change
// ======================

// Build the per-row components overlay used when resolving expressions inside
// a ListView. Without this overlay, `components.<sibling>` is the per-row array
// and `.value` access fails. Spreading `{ ...state, components: scopeCtx.scoped }`
// only spreads ~10 top-level keys (components, variables, queries, globals, page,
// etc.) — trivially cheap. When listviewId is null/no descendants, returns the
// raw state with scopeCtx=null and the caller skips updateRowScope.
function buildRowScopedState({ get, listviewId, moduleId }) {
  const state = get().getAllExposedValues(moduleId);
  const scopeCtx = listviewId ? get().prepareRowScope(state.components, listviewId, moduleId) : null;
  const scopedState = scopeCtx ? { ...state, components: scopeCtx.scoped } : state;
  return { state, scopeCtx, scopedState };
}

// Build a value resolver that applies a per-row components overlay when the
// caller is inside a ListView. Without this, expressions like
// `{{components.textinput1.value}}` evaluated during validation see the per-row
// array stored under `components.textinput1` instead of the current row's object.
// Mirrors the prepareRowScope/updateRowScope pattern used by setAllValueToComponent.
function buildRowScopedResolver({ get, nearestListviewId, rowIndex, moduleId, customResolveObjects }) {
  if (nearestListviewId && rowIndex !== undefined && rowIndex !== null) {
    const { scopeCtx, scopedState } = buildRowScopedState({ get, listviewId: nearestListviewId, moduleId });
    if (scopeCtx) {
      get().updateRowScope(scopeCtx, rowIndex);
      return (value) => {
        if (typeof value !== 'string' || !value.includes('{{') || !value.includes('}}')) {
          return value;
        }
        const re = extractAndReplaceReferencesFromString(
          value,
          get().modules[moduleId].componentNameIdMapping,
          get().modules[moduleId].queryNameIdMapping
        );
        return resolveDynamicValues(re.valueWithBrackets, scopedState, customResolveObjects, false, []);
      };
    }
  }
  return (value) => get().getResolvedValue(value, customResolveObjects, moduleId);
}
// TODO: page id to index mapping to be created and used across the state for current page access
const initialState = {
  modules: {
    canvas: {
      currentPageId: null,
      currentPageIndex: 0,
      pages: [],
      componentNameIdMapping: {},
      queryNameIdMapping: {},
      queryIdNameMapping: {},
      currentPageHandle: null,
    },
  },
  containerChildrenMapping: {
    canvas: [],
  },
  selectedComponents: [],
  showWidgetDeleteConfirmation: false,
  deleteTargetIsModuleEditor: false,
  focusedParentId: null,
  modalsOpenOnCanvas: [],
  showComponentPermissionModal: false,
};

export const createComponentsSlice = (set, get) => ({
  ...initialState,

  initializeComponentsSlice: (moduleId) => {
    set(
      (state) => {
        state.modules[moduleId] = { ...initialState.modules.canvas };
        state.containerChildrenMapping[moduleId] = [];
      },
      false,
      'initializeComponentsSlice'
    );
  },

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

  setCurrentPageId: (id, moduleId = 'canvas') => {
    set(
      (state) => {
        const currentPageIndex = state.modules[moduleId].pages.findIndex((page) => page.id === id);
        const currentPageComponents = state.modules[moduleId].pages[currentPageIndex]?.components || {};
        state.modules[moduleId].currentPageIndex = currentPageIndex;
        state.modules[moduleId].currentPageId = id;
        state.containerChildrenMapping[moduleId] = [];
        Object.entries(currentPageComponents).forEach(([componentId, component]) => {
          const parentId = component.component.parent || moduleId;
          if (!state.containerChildrenMapping[parentId]) {
            state.containerChildrenMapping[parentId] = [];
          }
          if (!state.containerChildrenMapping[parentId].includes(componentId)) {
            state.containerChildrenMapping[parentId].push(componentId);
          }
        });
      },
      false,
      'setCurrentPageId'
    );
  },
  setCurrentPageHandle: (handle, moduleId = 'canvas') => {
    set(
      (state) => {
        state.modules[moduleId].currentPageHandle = handle;
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
    get().rebuildComponentHints(moduleId);
  },

  renameComponentNameIdMapping: (oldName, newName, moduleId = 'canvas') => {
    set((state) => {
      state.modules[moduleId].componentNameIdMapping[newName] = state.modules[moduleId].componentNameIdMapping[oldName];
      delete state.modules[moduleId].componentNameIdMapping[oldName];
    });
    get().rebuildComponentHints(moduleId);
  },

  deleteComponentNameIdMapping: (componentName, moduleId = 'canvas') => {
    set(
      (state) => {
        delete state.modules[moduleId].componentNameIdMapping[componentName];
      },
      false,
      'deleteComponentNameIdMapping'
    );
    get().rebuildComponentHints(moduleId);
  },

  setComponentNameIdMapping: (moduleId = 'canvas') => {
    const components = get().getCurrentPageComponents(moduleId);
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
    const { renameComponentNameIdMapping, saveComponentChanges, getCurrentPageIndex } = get();
    const currentPageIndex = getCurrentPageIndex(moduleId);
    let oldName = '';
    set(
      (state) => {
        oldName = state.modules[moduleId].pages[currentPageIndex].components[componentId].component.name;
        state.modules[moduleId].pages[currentPageIndex].components[componentId].component.name = newName;

        if (state.modules[moduleId].pages[currentPageIndex].components[componentId].name) {
          state.modules[moduleId].pages[currentPageIndex].components[componentId].name = newName;
        }
      },
      false,
      'setComponentName'
    );

    const diff = {
      [componentId]: { component: { name: newName } },
    };

    saveComponentChanges(diff, 'components', 'update', moduleId);
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
  clearSelectedComponents: () =>
    set(
      (state) => {
        state.selectedComponents = [];
        state.isCanvasHeaderSelected = false;
        state.isCanvasFooterSelected = false;
        if (state.isRightSidebarOpen) {
          state.activeRightSideBarTab =
            state.activeRightSideBarTab === RIGHT_SIDE_BAR_TAB.PAGES
              ? RIGHT_SIDE_BAR_TAB.PAGES
              : RIGHT_SIDE_BAR_TAB.COMPONENTS;
        }
      },
      false,
      'clearSelectedComponents'
    ),

  renameQueryMapping: (oldName, newName, queryId, moduleId = 'canvas') => {
    set((state) => {
      state.modules[moduleId].queryNameIdMapping[newName] = state.modules[moduleId].queryNameIdMapping[oldName];
      delete state.modules[moduleId].queryNameIdMapping[oldName];
      state.modules[moduleId].queryIdNameMapping[queryId] = newName;
    });
    get().rebuildQueryHints(moduleId);
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
    get().rebuildQueryHints(moduleId);
  },

  generateDependencyGraphForRefs: (
    allRefs,
    key,
    paramType,
    property,
    unResolvedValue,
    isUpdate = false,
    moduleId = 'canvas'
  ) => {
    const { addDependency, updateDependency } = get();
    if (allRefs.length !== 0) {
      allRefs.forEach(({ entityType, entityNameOrId, entityKey }, index) => {
        const propertyValue = entityNameOrId
          ? `${entityType}.${entityNameOrId}.${entityKey}`
          : `${entityType}.${entityKey}`;
        const propertyPath = paramType === undefined ? `others.${key}` : `components.${key}.${paramType}.${property}`;
        if (isUpdate && index === 0) {
          updateDependency(propertyValue, propertyPath, unResolvedValue, moduleId);
        } else {
          addDependency(propertyValue, propertyPath, unResolvedValue, moduleId);
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
      findNearestSubcontainerAncestor,
      getCustomResolvables,
      setAllValueToComponent,
      getComponentDefinition,
      getBaseParentId,
    } = get();
    let customResolvables = {};
    const parentId = component?.parent;
    const componentDetails = { componentId, paramType, property };
    // Nearest row-scoped ancestor (Listview / Kanban / Table) — the one whose per-row customResolvables this component resolves against.
    const nearestRowScopedAncestorId = findNearestSubcontainerAncestor(parentId, moduleId);
    let index = nearestRowScopedAncestorId ? 0 : null;
    if (index !== null) {
      // For components nested inside row-scoped ancestors, build parentIndices by walking up the ancestor chain.
      // Row-scoped parent IDs don't contain row indices — the row info is only available at render time.
      // At drop time, we use index 0 for each row-scoped ancestor as a default for initial resolution.
      const parentIndices = [];

      // Walk up the ancestor chain starting from the nearest row-scoped ancestor's parent
      const nearestDef = getComponentDefinition(nearestRowScopedAncestorId, moduleId);
      let ancestorId = nearestDef?.component?.parent;
      const ancestorVisited = new Set();
      while (ancestorId) {
        const baseAncestorId = getBaseParentId(ancestorId) || ancestorId;
        if (ancestorVisited.has(baseAncestorId)) break;
        ancestorVisited.add(baseAncestorId);
        const ancestorDef = getComponentDefinition(baseAncestorId, moduleId);
        const ancestorType = ancestorDef?.component?.component;
        if (ROW_SCOPED_WIDGET_TYPES.includes(ancestorType)) {
          // Add 0 at the beginning for each row-scoped ancestor (outer-most first)
          parentIndices.unshift(0);
        }
        ancestorId = ancestorDef?.component?.parent;
      }

      customResolvables = getCustomResolvables(nearestRowScopedAncestorId, null, moduleId, parentIndices);
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
        const customResolvableRefs = getCustomResolvableReference(value, parentId, moduleId);
        if (customResolvableRefs.length > 0) {
          allRefs.push(...customResolvableRefs);
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
    const {
      getAllExposedValues,
      getComponentTypeFromId,
      getComponentDefinition,
      findNearestSubcontainerAncestor,
      updateRowScope,
    } = get();
    const { componentId, paramType, property } = componentDetails;
    const length = Object.keys(customResolvables).length;

    // Find nearest ListView for row-scoped component resolution
    const parentId = getComponentDefinition(componentId, moduleId)?.component?.parent;
    const nearestListviewId = parentId ? findNearestSubcontainerAncestor(parentId, moduleId) : null;

    const updateResolvedValueForNonNullIndex = (resolvedValue, idx) => {
      if (!componentResolvedValues[componentId] || Object.keys(componentResolvedValues[componentId]).length === 0) {
        componentResolvedValues[componentId] = [];
      }

      if (!componentResolvedValues[componentId][idx]) {
        componentResolvedValues[componentId][idx] =
          idx === 0 ? deepClone(DEFAULT_COMPONENT_STRUCTURE) : deepClone(componentResolvedValues[componentId][0]);
      }

      if (!componentResolvedValues[componentId][idx][paramType]) {
        componentResolvedValues[componentId][idx][paramType] = {};
      }

      if (hasArrayNotation(property)) {
        const keys = parsePropertyPath(property);
        lodashSet(
          componentResolvedValues,
          [componentId, idx, paramType, ...keys],
          getComponentTypeFromId(componentId, moduleId) === 'Table' ? value : resolvedValue
        );
      } else {
        componentResolvedValues[componentId][idx][paramType][property] = resolvedValue;
      }
    };

    if (length === 0) {
      const resolvedValue = shouldResolve
        ? resolveDynamicValues(value, getAllExposedValues(moduleId), customResolvables, false, [])
        : value;

      if (index !== null) {
        updateResolvedValueForNonNullIndex(resolvedValue, index);
      } else {
        if (!componentResolvedValues[componentId] || Object.keys(componentResolvedValues[componentId]).length === 0) {
          componentResolvedValues[componentId] = deepClone(DEFAULT_COMPONENT_STRUCTURE);
        }

        if (!componentResolvedValues[componentId][paramType]) {
          componentResolvedValues[componentId][paramType] = {};
        }

        if (hasArrayNotation(property)) {
          const keys = parsePropertyPath(property);
          lodashSet(
            componentResolvedValues,
            [componentId, paramType, ...keys],
            getComponentTypeFromId(componentId, moduleId) === 'Table' ? value : resolvedValue
          );
        } else {
          componentResolvedValues[componentId][paramType][property] = resolvedValue;
        }
      }
    } else {
      // Component is inside a ListView — resolve once per row with row-scoped components.
      //
      // How this works:
      //   1. getAllExposedValues returns the full state: { components, variables, queries, ... }
      //      where components['checkbox-uuid'] = [row0, row1, row2, ...] (per-row arrays)
      //   2. prepareRowScope creates a prototype overlay on state.components (done once)
      //   3. For each row, updateRowScope overwrites descendants on the overlay with that row's
      //      values, so the resolver sees e.g. components['checkbox-uuid'] = { value: true }
      //      instead of the full array
      //   4. scopedState holds a reference to the overlay object, so mutating the overlay
      //      in updateRowScope is automatically visible to the resolver — no need to recreate
      //      scopedState each iteration
      const { scopeCtx, scopedState } = buildRowScopedState({ get, listviewId: nearestListviewId, moduleId });

      for (let i = 0; i < length; i++) {
        // Mutate the overlay in place: swap descendant entries to row i's values
        if (scopeCtx) updateRowScope(scopeCtx, i);
        const resolvedValue = shouldResolve
          ? resolveDynamicValues(value, scopedState, customResolvables[i] || {}, false, [])
          : value;

        updateResolvedValueForNonNullIndex(resolvedValue, i);
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
      findNearestSubcontainerAncestor,
      getComponentDefinition,
      getBaseParentId,
      updateRowScope,
    } = get();

    let shouldResolve = false;
    const isInListview = !!findNearestSubcontainerAncestor(parentId, moduleId);

    if (
      typeof unResolvedValue === 'string' &&
      unResolvedValue?.includes('{{') &&
      unResolvedValue?.includes('}}') &&
      !skipResolve
    ) {
      shouldResolve = true;
    }

    if (!isInListview) {
      // Not in a ListView - simple case
      const resolvedValue = shouldResolve
        ? resolveDynamicValues(unResolvedValue, getAllExposedValues(moduleId), {}, false, [])
        : value;
      setResolvedComponentByProperty(componentId, paramType, property, resolvedValue, null, moduleId);
      return;
    }

    // Component is inside a ListView - need to handle N-level nesting
    // Build the parent hierarchy to find all ListView ancestors
    const listviewAncestors = [];
    let currentParentId = parentId;
    const listviewAncestorVisited = new Set();
    while (currentParentId) {
      const baseId = getBaseParentId?.(currentParentId) || currentParentId;
      if (listviewAncestorVisited.has(baseId)) break;
      listviewAncestorVisited.add(baseId);
      const parentDef = getComponentDefinition(baseId, moduleId);
      const parentType = parentDef?.component?.component;
      if (ROW_SCOPED_WIDGET_TYPES.includes(parentType)) {
        listviewAncestors.unshift(baseId); // Add to front to maintain order from outer to inner
      }
      currentParentId = parentDef?.component?.parent;
    }

    if (listviewAncestors.length === 0) {
      // Fallback - shouldn't happen but handle gracefully
      const resolvedValue = shouldResolve
        ? resolveDynamicValues(unResolvedValue, getAllExposedValues(moduleId), {}, false, [])
        : value;
      setResolvedComponentByProperty(componentId, paramType, property, resolvedValue, null, moduleId);
      return;
    }

    // Get the innermost (immediate parent) ListView's customResolvables
    const innermostListview = listviewAncestors[listviewAncestors.length - 1];
    const baseCustomResolvables = getCustomResolvables(innermostListview, null, moduleId, []);

    // Helper function to recursively iterate through all index combinations
    const iterateNestedIndices = (resolvables, currentIndices, depth) => {
      if (!resolvables || typeof resolvables !== 'object') return;

      // Check if this is the leaf level (array of listItem objects)
      const isLeafLevel =
        Array.isArray(resolvables) &&
        resolvables.length > 0 &&
        resolvables[0] &&
        typeof resolvables[0] === 'object' &&
        ('listItem' in resolvables[0] || 'cardData' in resolvables[0] || 'rowData' in resolvables[0]);

      if (isLeafLevel) {
        // At the leaf level of nested ListView traversal — resolvables is an array of
        // per-row { listItem } objects. Now resolve the expression for each row, with
        // row-scoped components so that {{components.checkbox1.value}} returns the
        // row-specific value, not the full per-row array.

        // For lazy parents (eg. Table expandable rows),
        // only resolve index 0 (template) + any currently needed rows.
        // Remaining rows are resolved on-demand.
        const { isLazyResolvableParent, getLazyRowIndices } = get();
        const isLazy = isLazyResolvableParent(innermostListview, moduleId);
        const indicesToResolve = isLazy
          ? getLazyRowIndices(innermostListview, moduleId, true)
          : Array.from({ length: resolvables.length }, (_, i) => i);

        const { scopeCtx, scopedState } = buildRowScopedState({ get, listviewId: innermostListview, moduleId });

        for (const i of indicesToResolve) {
          if (i >= resolvables.length) continue;
          const fullIndices = [...currentIndices, i];
          if (scopeCtx) updateRowScope(scopeCtx, i);
          const resolvedValue = shouldResolve
            ? resolveDynamicValues(unResolvedValue, scopedState, resolvables[i] || {}, false, [])
            : value;
          setResolvedComponentByProperty(componentId, paramType, property, resolvedValue, fullIndices, moduleId);
        }
      } else if (Array.isArray(resolvables)) {
        // Array but not leaf level - iterate through
        for (let i = 0; i < resolvables.length; i++) {
          iterateNestedIndices(resolvables[i], [...currentIndices, i], depth + 1);
        }
      } else {
        // Object keyed by parent indices - iterate through keys
        const keys = Object.keys(resolvables);
        for (const key of keys) {
          const idx = parseInt(key, 10);
          if (!isNaN(idx)) {
            iterateNestedIndices(resolvables[key], [...currentIndices, idx], depth + 1);
          }
        }
      }
    };

    iterateNestedIndices(baseCustomResolvables, [], 0);
  },

  validateWidget: ({
    validationObject,
    widgetValue,
    customResolveObjects,
    componentType,
    nearestListviewId,
    rowIndex,
    moduleId = 'canvas',
  }) => {
    let isValid = true;
    let validationError = null;

    // For widgets inside a ListView, `components.<sibling>.value` resolves through
    // a flat exposedValues map where `components.<sibling>` is the per-row array.
    // Mirror setAllValueToComponent's row-scope overlay so validation expressions
    // see the current row's values instead of the array.
    const resolveValue = buildRowScopedResolver({
      get,
      nearestListviewId,
      rowIndex,
      moduleId,
      customResolveObjects,
    });

    const regex = validationObject?.regex?.value ?? validationObject?.regex;
    const minLength = validationObject?.minLength?.value ?? validationObject?.minLength;
    const maxLength = validationObject?.maxLength?.value ?? validationObject?.maxLength;
    const minValue = validationObject?.minValue?.value ?? validationObject?.minValue;
    const maxValue = validationObject?.maxValue?.value ?? validationObject?.maxValue;
    const customRule = validationObject?.customRule?.value ?? validationObject?.customRule;
    const mandatory = validationObject?.mandatory?.value ?? validationObject?.mandatory;
    let validationRegex = resolveValue(regex) ?? '';
    validationRegex = typeof validationRegex === 'string' ? validationRegex : '';

    if (componentType === 'EmailInput' && widgetValue) {
      const validationRegex = '^(?!.*\\.\\.)([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,})$';
      const emailRegex = new RegExp(validationRegex, 'g');
      if (!emailRegex.test(widgetValue)) {
        return {
          isValid: false,
          validationError: 'Input should be a valid email',
        };
      }
    }

    if (validationRegex && validationRegex.trim() !== '') {
      try {
        const re = new RegExp(validationRegex, 'g');
        if (!re.test(widgetValue)) {
          return {
            isValid: false,
            validationError: 'The input should match pattern',
          };
        }
      } catch (err) {
        // Invalid/faulty regex pattern (eg, unterminated `[123123`). Surface it as a
        // validation message instead of letting the SyntaxError crash the widget render.
        return {
          isValid: false,
          validationError: 'Invalid regex pattern',
        };
      }
    }

    const resolvedMinLength = resolveValue(minLength) || 0;
    if ((widgetValue || '').length < parseInt(resolvedMinLength)) {
      return {
        isValid: false,
        validationError: `Minimum ${resolvedMinLength} characters is needed`,
      };
    }

    const resolvedMaxLength = resolveValue(maxLength) || undefined;
    if (resolvedMaxLength !== undefined) {
      if ((widgetValue || '').length > parseInt(resolvedMaxLength)) {
        return {
          isValid: false,
          validationError: `Maximum ${resolvedMaxLength} characters is allowed`,
        };
      }
    }

    const resolvedMinValue = resolveValue(minValue) || undefined;
    if (resolvedMinValue !== undefined) {
      if (widgetValue === undefined || widgetValue < parseFloat(resolvedMinValue)) {
        return {
          isValid: false,
          validationError: `Minimum value is ${resolvedMinValue}`,
        };
      }
    }

    const resolvedMaxValue = resolveValue(maxValue) || undefined;
    if (resolvedMaxValue !== undefined) {
      if (widgetValue === undefined || widgetValue > parseFloat(resolvedMaxValue)) {
        return {
          isValid: false,
          validationError: `Maximum value is ${resolvedMaxValue}`,
        };
      }
    }

    const resolvedCustomRule = resolveValue(customRule) || false;
    if (typeof resolvedCustomRule === 'string' && resolvedCustomRule !== '') {
      return { isValid: false, validationError: resolvedCustomRule };
    }

    const resolvedMandatory = resolveValue(mandatory) || false;
    // only option-based widgets (DropdownV2, MultiselectV2) can have false as a legitimate user-defined option value. For everything else, false correctly means "empty/unfulfilled."
    const optionValueWidgets = ['DropdownV2', 'MultiselectV2', 'Cascader'];
    const isEmpty = Array.isArray(widgetValue)
      ? widgetValue.length === 0
      : !widgetValue && widgetValue !== 0 && !(widgetValue === false && optionValueWidgets.includes(componentType));

    if (resolvedMandatory == true && isEmpty) {
      return {
        isValid: false,
        validationError: `Field cannot be empty`,
      };
    }

    // Selection count validations (for array-based widgets like TreeSelect, Multiselect)
    if (Array.isArray(widgetValue)) {
      const minSelection = validationObject?.minSelection?.value ?? validationObject?.minSelection;
      const maxSelection = validationObject?.maxSelection?.value ?? validationObject?.maxSelection;

      const resolvedMinSelection = parseInt(resolveValue(minSelection)) || 0;
      if (resolvedMinSelection > 0 && widgetValue.length < resolvedMinSelection) {
        return {
          isValid: false,
          validationError: `Minimum ${resolvedMinSelection} selections required`,
        };
      }

      const resolvedMaxSelection = parseInt(resolveValue(maxSelection)) || 0;
      if (resolvedMaxSelection > 0 && widgetValue.length > resolvedMaxSelection) {
        return {
          isValid: false,
          validationError: `Maximum ${resolvedMaxSelection} selections allowed`,
        };
      }
    }

    return {
      isValid,
      validationError,
    };
  },

  validateDates: ({
    validationObject,
    widgetValue,
    customResolveObjects,
    nearestListviewId,
    rowIndex,
    moduleId = 'canvas',
  }) => {
    let isValid = true;
    let validationError = null;
    const resolveValue = buildRowScopedResolver({
      get,
      nearestListviewId,
      rowIndex,
      moduleId,
      customResolveObjects,
    });
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

    const resolvedMinDate = resolveValue(validationObject?.minDate?.value) || undefined;
    const resolvedMaxDate = resolveValue(validationObject?.maxDate?.value) || undefined;
    const resolvedMinTime = resolveValue(validationObject?.minTime?.value) || undefined;
    const resolvedMaxTime = resolveValue(validationObject?.maxTime?.value) || undefined;

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
    const resolvedCustomRule = resolveValue(customRule) || false;
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
    if (Array.isArray(value)) {
      const updatedPropertyValue = cloneDeep(value);
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
              generateDependencyGraphForRefs(
                allRefs,
                componentId,
                paramType,
                propertyWithArrayValue,
                unResolvedValue,
                false,
                moduleId
              );
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
          if (allRefs.length) {
            generateDependencyGraphForRefs(
              allRefs,
              componentId,
              paramType,
              propertyWithArrayValue,
              unResolvedValue,
              false,
              moduleId
            );
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
        generateDependencyGraphForRefs(allRefs, componentId, paramType, property, unResolvedValue, false, moduleId);
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
    let resolvedComponentValues = { [componentId]: deepClone(getResolvedComponent(componentId, null, moduleId) ?? {}) };
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
    // Cancel any pending rerun timers from the previous page/context
    clearAllQueryRerunTimers();

    const {
      getCurrentPageComponents,
      addToDependencyGraph,
      setResolvedComponents,
      resolveOthers,
      startDependencyBatch,
      flushDependencyBatch,
      registerQueryDependencies,
    } = get();
    const components = getCurrentPageComponents(moduleId);

    //TODO: Replace with object of component types
    let resolvedComponentValues = {};

    startDependencyBatch();
    Object.entries(components).forEach(([componentId, component]) => {
      resolvedComponentValues[componentId] = addToDependencyGraph(moduleId, componentId, component.component);
    });
    flushDependencyBatch();

    setResolvedComponents(resolvedComponentValues, moduleId);
    resolveOthers(moduleId);

    // Pre-populate default exposed values for all components in a single store write.
    // This prevents 600+ individual set() calls during component mount in RenderWidget
    // (setDefaultExposedValues will early-return since values already exist).
    set(
      (state) => {
        Object.entries(components).forEach(([componentId, component]) => {
          const componentType = component.component.component;
          const parentId = component.component.parent;

          const existing = state.resolvedStore.modules[moduleId].exposedValues.components[componentId];
          if (existing && Object.keys(existing).length > 0) return;

          const compDef = componentTypeDefinitionMap[componentType];
          if (!compDef) return;

          // Skip components with a Listview ancestor — they use per-row array storage at runtime
          // and cannot be pre-populated flat. Form children without a Listview ancestor can be
          // pre-populated here, eliminating their individual set() calls at mount time.
          if (parentId) {
            let cur = components[parentId];
            while (cur) {
              if (ROW_SCOPED_WIDGET_TYPES.includes(cur.component.component)) return;
              cur = components[cur.component.parent];
            }
          }

          const exposedVariables = compDef.exposedVariables || {};
          state.resolvedStore.modules[moduleId].exposedValues.components[componentId] = {
            ...exposedVariables,
            id: componentId,
          };
        });
      },
      false,
      'batchSetDefaultExposedValues'
    );
    // Register query option dependencies for queries with runOnDependencyChange enabled
    const queries = get().dataQuery?.queries?.modules?.[moduleId] || [];
    queries.forEach((query) => {
      if (query.options?.runOnDependencyChange) {
        registerQueryDependencies(query.id, query.name, query.kind, query.options, moduleId);
      }
    });
  },

  registerQueryDependencies: (queryId, queryName, kind, options, moduleId = 'canvas') => {
    // RunJS/RunPy do not support dependency-triggered re-runs
    if (kind === 'runjs' || kind === 'runpy') return;

    const { addDependency } = get();
    const optionsPath = `queries.${queryId}.__options__`;

    // Clean up existing __options__ node and all its edges
    const depGraph = get().dependencyGraph.modules[moduleId]?.graph;
    if (depGraph && depGraph.hasNode(optionsPath)) {
      set(
        (state) => {
          state.dependencyGraph.modules[moduleId].graph.removeLeafNode(optionsPath);
          return { ...state };
        },
        false,
        'clearQueryOptionsDeps'
      );
    }

    // Extract all {{}} refs from the query's active options
    const refs = extractQueryReferences(kind, options);
    if (!refs.length) return;

    const componentNameIdMapping = get().modules[moduleId].componentNameIdMapping;
    const queryNameIdMapping = get().modules[moduleId].queryNameIdMapping;

    refs.forEach((ref) => {
      const { allRefs } = extractAndReplaceReferencesFromString(ref, componentNameIdMapping, queryNameIdMapping);
      allRefs.forEach(({ entityType, entityNameOrId, entityKey }) => {
        const sourcePath = entityNameOrId
          ? `${entityType}.${entityNameOrId}.${entityKey}`
          : `${entityType}.${entityKey}`;
        addDependency(sourcePath, optionsPath, { queryId, queryName }, moduleId);
      });
    });
  },

  //It can be extended if any of the fx needs to be resolved dynamically outside components
  getOtherFieldsToBeResolved: (moduleId) => {
    return {
      canvasBackgroundColor: get().globalSettings.backgroundFxQuery,
      isPagesSidebarHidden: get().pageSettings?.definition?.properties?.disableMenu?.value,
      pages: get().modules[moduleId].pages.reduce((accumulator, currentObject) => {
        if (currentObject && currentObject.id) {
          accumulator[currentObject.id] = { hidden: currentObject.hidden };
        }
        return accumulator;
      }, {}),
    };
  },

  // TODO: This function is used to resolve the page hidden value, needs to be refactored to use the same logic as resolveOthers
  resolvePageHiddenValue: (moduleId, isUpdate = false, pageId, item) => {
    const { getAllExposedValues, generateDependencyGraphForRefs } = get();
    let resolvedValue = item;
    if (typeof item === 'string' && item?.includes('{{') && item?.includes('}}')) {
      const { allRefs, valueWithBrackets } = extractAndReplaceReferencesFromString(
        item,
        get().modules[moduleId].componentNameIdMapping,
        get().modules[moduleId].queryNameIdMapping
      );
      resolvedValue = resolveDynamicValues(valueWithBrackets, getAllExposedValues(moduleId), {}, false, []);
      generateDependencyGraphForRefs(
        allRefs,
        `pages.${pageId}.hidden`,
        undefined,
        undefined,
        valueWithBrackets,
        isUpdate,
        moduleId
      );
    }
    set(
      (state) => {
        state.resolvedStore.modules[moduleId].others.pages[pageId] = { hidden: resolvedValue };
      },
      false,
      'resolvePageHiddenValue'
    );
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
      if (key === 'pages') {
        Object.entries(item).forEach(([pageId, page]) => {
          const { hidden = null } = page;
          if (!resolvedValues[key]) {
            resolvedValues[key] = {};
          }

          if (typeof hidden?.value === 'string' && hidden?.value?.includes('{{') && hidden?.value?.includes('}}')) {
            const { allRefs, valueWithBrackets } = extractAndReplaceReferencesFromString(
              hidden.value,
              get().modules[moduleId].componentNameIdMapping,
              get().modules[moduleId].queryNameIdMapping
            );

            const resolvedValue = resolveDynamicValues(valueWithBrackets, getAllExposedValues(moduleId), {}, false, []);
            resolvedValues[key][pageId] = { hidden: resolvedValue };
            generateDependencyGraphForRefs(
              allRefs,
              `pages.${pageId}.hidden`,
              undefined,
              undefined,
              valueWithBrackets,
              isUpdate,
              moduleId
            );
          } else {
            resolvedValues[key][pageId] = { hidden };
          }
        });
      } else if (typeof item === 'string' && item?.includes('{{') && item?.includes('}}')) {
        const { allRefs, valueWithBrackets } = extractAndReplaceReferencesFromString(
          item,
          get().modules[moduleId].componentNameIdMapping,
          get().modules[moduleId].queryNameIdMapping
        );
        const resolvedValue = resolveDynamicValues(valueWithBrackets, getAllExposedValues(moduleId), {}, false, []);
        resolvedValues[key] = resolvedValue;
        generateDependencyGraphForRefs(allRefs, key, undefined, undefined, valueWithBrackets, isUpdate, moduleId);
      } else {
        resolvedValues[key] = item;
      }
    });
    setResolvedValueForOthers(resolvedValues, moduleId);
  },
  canAddToParent: (parentId, currentWidget, moduleId = 'canvas') => {
    const { getComponentTypeFromId, getComponentDefinition, getBaseParentId } = get();
    const transformedParentId = parentId?.length > 36 ? parentId.slice(0, 36) : parentId;
    let parentType = getComponentTypeFromId(transformedParentId, moduleId);
    const parentWidget = getParentWidgetFromId(parentType, parentId);
    const parentSlotType = parentId ? parentId.split('-').pop() : undefined;
    const restrictedWidgets = [
      ...(RESTRICTED_WIDGETS_CONFIG?.[parentWidget] || []),
      ...(['header', 'footer'].includes(parentSlotType) ? RESTRICTED_WIDGET_SLOTS_CONFIG : []),
    ];
    const isParentChangeAllowed = !restrictedWidgets.includes(currentWidget);
    if (!isParentChangeAllowed) {
      toast.error(
        `${currentWidget} is not compatible as a child component of ${getDropTargetLabel(parentWidget, parentSlotType)}`
      );
      return false;
    }

    // Check nesting depth restrictions from NESTING_LEVEL_LIMITS (e.g., Listview: 2, Table: 3)
    const nestingLimit = NESTING_LEVEL_LIMITS[currentWidget];
    if (nestingLimit) {
      let currentParentId = parentId;
      let count = 0;
      const visited = new Set();
      while (currentParentId) {
        const baseId = getBaseParentId?.(currentParentId) || currentParentId;
        if (visited.has(baseId)) break;
        visited.add(baseId);
        const parentDef = getComponentDefinition(baseId, moduleId);
        if (parentDef?.component?.component === currentWidget) {
          count++;
          if (count >= nestingLimit) {
            toast.error(`${currentWidget} nesting is limited to ${nestingLimit} levels`);
            return false;
          }
        }
        currentParentId = parentDef?.component?.parent;
      }
    }

    return true;
  },
  addComponentToCurrentPage: (
    componentDefinitions,
    moduleId = 'canvas',
    { skipUndoRedo = false, saveAfterAction = true, skipFormUpdate = false } = {}
  ) => {
    const {
      saveComponentChanges,
      withUndoRedo,
      updateComponentDependencyGraph,
      getCurrentPageComponents,
      canAddToParent,
      getComponentNameFromId,
      deleteComponentNameIdMapping,
      checkIfParentIsFormAndAddField,
      buildComponentDefinition,
      getCurrentPageId,
      getComponentDefinition,
    } = get();
    const currentPageId = getCurrentPageId(moduleId);
    // This is made into a promise to wait for the saveComponentChanges to complete so that the caller can await it
    return new Promise((resolve) => {
      if (
        canAddToParent(
          componentDefinitions[0].component.parent,
          componentDefinitions[0].component.component,
          moduleId
        ) === false
      ) {
        resolve(false);
        return;
      }
      const newComponents = buildComponentDefinition(componentDefinitions, moduleId);

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
      const flexChildOrderUpdates = {};

      newComponents.forEach((newComponent) => {
        // Have added this condition to delete the oldName from the mapping if it exists due to cut pasting multiple times
        const oldName = getComponentNameFromId(newComponent.id, moduleId);
        if (oldName) {
          deleteComponentNameIdMapping(oldName, moduleId);
        }
        updateComponentDependencyGraph(moduleId, newComponent);

        // For ListView, initialize customResolvables immediately after processing
        // so that child components processed later can access them
        if (newComponent.component.component === 'Listview') {
          const { getResolvedComponent, updateCustomResolvables, getBaseParentId, getComponentDefinition } = get();
          const resolvedComponent = getResolvedComponent(newComponent.id, null, moduleId);
          const data = resolvedComponent?.properties?.data;
          if (Array.isArray(data) && data.length > 0) {
            // Build parentIndices for each row-scoped ancestor (outer-most first)
            const parentIndices = [];
            const componentParentId = newComponent.component.parent;
            if (componentParentId) {
              let ancestorId = componentParentId;
              const ancestorVisited = new Set();
              while (ancestorId) {
                const baseAncestorId = getBaseParentId(ancestorId);
                if (ancestorVisited.has(baseAncestorId)) break;
                ancestorVisited.add(baseAncestorId);
                const ancestorDef = getComponentDefinition(baseAncestorId, moduleId);
                if (ROW_SCOPED_WIDGET_TYPES.includes(ancestorDef?.component?.component)) {
                  parentIndices.unshift(0);
                }
                ancestorId = ancestorDef?.component?.parent;
              }
            }
            const listItems = data.map((listItem) => ({ listItem }));
            updateCustomResolvables(newComponent.id, listItems, 'listItem', moduleId, parentIndices);
          }
        }

        const parentId = newComponent.component.parent || 'canvas';
        // Check if parent is a Form and add the component to form fields if needed
        !skipFormUpdate && checkIfParentIsFormAndAddField(newComponent.id, newComponent, parentId, moduleId);
        set(
          withUndoRedo((state) => {
            if (!state.containerChildrenMapping[parentId]) {
              state.containerChildrenMapping[parentId] = [];
            }
            if (!state.containerChildrenMapping[parentId].includes(newComponent.id)) {
              state.containerChildrenMapping[parentId].push(newComponent.id);
            }
            const page = state.modules[moduleId].pages.find((page) => page.id === currentPageId);
            page.components[newComponent.id] = newComponent;
            get().addFlexContainerChildOrderToDraft({
              state,
              page,
              parentId,
              childId: newComponent.id,
              flexChildOrderUpdates,
            });
          }, skipUndoRedo),
          false,
          'addComponentToCurrentPage'
        );
      });

      if (!skipFormUpdate) {
        const selectedComponents = findHighestLevelofSelection(newComponents);
        get().setSelectedComponents(selectedComponents.map((component) => component.id));
      }

      if (saveAfterAction) {
        const flexParentUpdateDiff = Object.entries(flexChildOrderUpdates).reduce((acc, [componentId, childOrder]) => {
          const component = getComponentDefinition(componentId, moduleId)?.component;
          if (component) acc[componentId] = get().buildFlexChildOrderComponentDiff(component, childOrder);
          return acc;
        }, {});

        const savePromise =
          Object.keys(flexParentUpdateDiff).length > 0
            ? saveComponentChanges(
                {
                  create: {
                    diff,
                    pageId: currentPageId,
                  },
                  update: {
                    diff: flexParentUpdateDiff,
                  },
                },
                'components/batch',
                'update',
                moduleId
              )
            : saveComponentChanges(diff, 'components', 'create', moduleId);

        savePromise
          .then(() => {
            resolve(); // Resolve the promise after all operations are complete
          })
          .catch((error) => {
            toast.error('App could not be saved.');
            console.error('Error saving component changes:', error);
          });
        get().multiplayer.broadcastUpdates(newComponents, 'components', 'create');
      }
      if (skipFormUpdate) resolve(diff);
    });
  },

  deleteComponents: (
    selected,
    moduleId = 'canvas',
    { skipUndoRedo = false, saveAfterAction = true, isCut = false, skipFormUpdate = false, isModuleEditor = false } = {}
  ) => {
    const {
      saveComponentChanges,
      getCurrentPageComponents,
      withUndoRedo,
      selectedComponents,
      deleteComponentNameIdMapping,
      removeNode,
      checkIfParentIsFormAndDeleteField,
      getCurrentPageId,
      checkIfComponentIsModule,
      clearModuleFromStore,
      getShouldFreeze,
      performBatchComponentOperations,
      getComponentDefinition,
      getCurrentPageIndex,
    } = get();
    const isAppBeingEditedByAI = get().ai?.isLoading ?? false;
    const shouldFreeze = getShouldFreeze(isAppBeingEditedByAI, isModuleEditor);
    const currentPageId = getCurrentPageId(moduleId);
    const appEvents = get().eventsSlice.getModuleEvents(moduleId);
    const componentNames = [];
    const componentIds = [];
    const _selectedComponents = selected?.length ? selected : selectedComponents;
    if (!_selectedComponents.length || shouldFreeze) return;

    const toDeleteComponents = [];
    const toDeleteEvents = [];
    const flexChildOrderUpdates = {};
    const allComponents = getCurrentPageComponents(moduleId);
    const affectedFormIds = new Set(); // Track which Forms need their fields updated

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
      // Update form fields locally but skip the API call - we'll batch it
      if (!skipFormUpdate) {
        const formId = checkIfParentIsFormAndDeleteField(componentId, moduleId, false, {
          skipSave: saveAfterAction,
        });
        if (formId) {
          affectedFormIds.add(formId);
        }
      }
      findAllChildComponents(componentId);
    });

    set(
      withUndoRedo((state) => {
        const page = state.modules?.[moduleId]?.pages.find((page) => page.id === currentPageId);
        const resolvedComponents = state.resolvedStore.modules?.[moduleId]?.components;
        const componentsExposedValues = state.resolvedStore.modules?.[moduleId]?.exposedValues.components;
        toDeleteComponents.forEach((id) => {
          // Remove from containerChildrenMapping
          Object.keys(state.containerChildrenMapping).forEach((containerId) => {
            state.containerChildrenMapping[containerId] = state.containerChildrenMapping[containerId].filter(
              (componentId) => {
                return componentId !== id;
              }
            );
          });

          get().removeDeletedComponentFromFlexChildOrdersInDraft({
            page,
            childId: id,
            toDeleteComponents,
            flexChildOrderUpdates,
          });

          if (checkIfComponentIsModule(id, moduleId)) {
            clearModuleFromStore(id);
          }

          // Remove the container itself if it's a container
          if (state.containerChildrenMapping[id]) {
            delete state.containerChildrenMapping[id];
          }
          if (state.containerChildrenMapping?.[moduleId]?.includes(id)) {
            state.containerChildrenMapping[moduleId] = state.containerChildrenMapping[moduleId].filter(
              (wid) => wid !== id
            );
          }
          componentNames.push(page.components[id]?.component?.name);
          componentIds.push(id);
          const eventsToRemove = appEvents.filter((event) => event.sourceId === id).map((event) => event.id);
          toDeleteEvents.push(...eventsToRemove);
          delete page.components[id]; // Remove the component from the page
          delete resolvedComponents[id]; // Remove the component from the resolved store
          delete componentsExposedValues[id]; // Remove the component from the exposed values
          if (!skipFormUpdate) {
            get().clearSelectedComponents();
          }
          removeNode(`components.${id}`, moduleId);
          state.showWidgetDeleteConfirmation = false; // Set it to false always
        });

        const filteredEvents = appEvents.filter((event) => !toDeleteEvents.includes(event.id));
        state.eventsSlice.module[moduleId].events = filteredEvents;
      }, skipUndoRedo),
      false,
      'deleteComponents'
    );

    // Handle save after state update
    if (saveAfterAction) {
      const showToast = () => {
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
      };

      const flexParentUpdateDiff = Object.entries(flexChildOrderUpdates).reduce((acc, [componentId, childOrder]) => {
        const component = getComponentDefinition(componentId, moduleId)?.component;
        if (component) acc[componentId] = get().buildFlexChildOrderComponentDiff(component, childOrder);
        return acc;
      }, {});

      // If Forms were affected, use batch operation to combine delete + form update
      if (affectedFormIds.size > 0 || Object.keys(flexParentUpdateDiff).length > 0) {
        // Build the form update diff
        const currentPageIndex = getCurrentPageIndex(moduleId);
        let formUpdateDiff = { ...flexParentUpdateDiff };
        affectedFormIds.forEach((formId) => {
          const formComponent = get().modules[moduleId].pages[currentPageIndex].components[formId]?.component;
          if (formComponent) {
            const { events, exposedVariables, ...filteredDefinition } = formComponent.definition || {};
            formUpdateDiff[formId] = {
              component: {
                ...formComponent,
                definition: filteredDefinition,
              },
            };
          }
        });

        performBatchComponentOperations(
          {
            updated: Object.keys(formUpdateDiff).length > 0 ? formUpdateDiff : undefined,
            deleted: toDeleteComponents,
          },
          moduleId
        )
          .then(() => {
            get().multiplayer.broadcastUpdates({ selectedComponents: _selectedComponents }, 'components', 'delete');
            showToast();
          })
          .catch((error) => {
            toast.error('App could not be saved.');
            console.error('Error saving component changes:', error);
          });
      } else {
        // No Forms affected, use regular delete endpoint
        saveComponentChanges(toDeleteComponents, 'components', 'delete', moduleId)
          .then(() => {
            get().multiplayer.broadcastUpdates({ selectedComponents: _selectedComponents }, 'components', 'delete');
            showToast();
          })
          .catch((error) => {
            toast.error('App could not be saved.');
            console.error('Error saving component changes:', error);
          });
      }
    }

    componentNames.forEach((componentName) => {
      deleteComponentNameIdMapping(componentName, moduleId);
    });
  },

  pasteComponents: async (components, moduleId = 'canvas') => {
    const { addComponentToCurrentPage, saveComponentChanges, getCurrentPageId, eventsSlice } = get();
    const currentPageId = getCurrentPageId(moduleId);

    // Add the components to the current page without saving (we'll save with events in batch)
    const diff = await addComponentToCurrentPage(components, moduleId, {
      saveAfterAction: false,
      skipFormUpdate: true,
    });

    // If no components were added, return early
    if (!diff || Object.keys(diff).length === 0) {
      return false;
    }

    // Collect all events from all components for bulk creation
    const allEvents = [];
    for (const component of components) {
      const events = component.events || [];
      for (const event of events) {
        // Only add events that have required fields
        if (event?.event && event?.target && component.id != null && event?.index != null) {
          allEvents.push({
            name: event?.name,
            event: {
              ...event.event,
            },
            eventType: event.target,
            attachedTo: component.id,
            index: event.index,
          });
        }
      }
    }

    // Create components and events together in a single batch request
    const batchDiff = {
      create: {
        diff: diff,
        pageId: currentPageId,
      },
      events: allEvents,
    };

    try {
      const response = await saveComponentChanges(batchDiff, 'components/batch', 'update', moduleId);

      // Add created events to the local store
      if (response?.events && response.events.length > 0) {
        response.events.forEach((event) => {
          eventsSlice.addEvent(event, moduleId);
        });
      }

      get().multiplayer.broadcastUpdates(components, 'components', 'create');
      return true;
    } catch (error) {
      console.error('Error pasting components with events:', error);
      toast.error('Failed to paste components');
      return false;
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
      checkParentAndUpdateFormFields,
      getCurrentPageIndex,
      performBatchComponentOperations,
      updateContainerAutoHeight,
      addToDependencyGraph,
      removeNode,
    } = get();
    const currentPageIndex = getCurrentPageIndex(moduleId);
    let hasParentChanged = false;
    let oldParentId;
    // Snapshot pre-mutation parents per affected component so we can revert if
    // the server's authoritative cycle guard rejects the batch.
    const oldParentByComponentId = {};

    // Reject the whole batch if any re-parent in it would form a cycle.
    // Skipping just the parent write while keeping the layout write would
    // leave widgets at coordinates measured against a parent they never
    // moved into.
    if (updateParent && newParentId) {
      const { getBaseParentId } = get();
      const pageComponents = get().modules[moduleId].pages[currentPageIndex].components;
      const cyclicId = Object.keys(componentLayouts).find((componentId) =>
        wouldCreateParentCycle(componentId, newParentId, pageComponents, getBaseParentId)
      );
      if (cyclicId) {
        const draggedName = pageComponents[cyclicId]?.component?.name || cyclicId;
        toast.error(`Cannot move "${draggedName}" here — it would create a parent-child loop.`);
        return;
      }
    }

    // Capture per-component pre-mutation parents AND layouts for the revert
    // path. The drag handler writes new coordinates (computed in the new
    // parent's coordinate system) before save fires, so a cycle reject needs
    // to restore both the parent ref AND the prior position to put the widget
    // back where it started visually.
    const oldLayoutByComponentId = {};
    if (updateParent) {
      const pageComponents = get().modules[moduleId].pages[currentPageIndex].components;
      Object.keys(componentLayouts).forEach((componentId) => {
        const comp = pageComponents[componentId];
        oldParentByComponentId[componentId] = comp?.component?.parent ?? null;
        if (comp?.layouts?.[currentLayout]) {
          oldLayoutByComponentId[componentId] = { ...comp.layouts[currentLayout] };
        }
      });
    }

    const flexChildOrderUpdates = {};

    // When updateParent is true and saveAfterAction is true, skip the save in checkParentAndUpdateFormFields
    // so we can batch the form field changes with the layout changes into a single API call
    const formFieldsDiff = updateParent
      ? checkParentAndUpdateFormFields(componentLayouts, newParentId, moduleId, { skipSave: saveAfterAction })
      : null;
    set(
      withUndoRedo((state) => {
        const page = state.modules[moduleId].pages[currentPageIndex];
        if (page) {
          // ============ Component layout update logic ============
          Object.entries(componentLayouts).forEach(([componentId, layout]) => {
            const component = page.components[componentId];
            const newParentComponentType = newParentId ? page.components[newParentId]?.component?.component : null;
            const oldParentComponentType = component?.component?.parent
              ? page.components[component.component.parent]?.component?.component
              : null;

            if (component) {
              if (newParentComponentType === 'FlexContainer' && updateParent) {
                // FlexContainer children: write only flex-specific fields, strip grid fields
                const defaultFlexLayout = createDefaultFlexChildLayout({
                  widthPx: layout.widthPx,
                  height: layout.height,
                });
                const { fillWidth, widthPx, height } = {
                  ...defaultFlexLayout,
                  ...layout,
                };
                const flexLayout = {};
                if (fillWidth !== undefined) flexLayout.fillWidth = fillWidth;
                if (widthPx !== undefined) flexLayout.widthPx = widthPx;
                if (height !== undefined) flexLayout.height = height;
                component.layouts[currentLayout] = {
                  ...component.layouts[currentLayout],
                  ...flexLayout,
                };
                // Strip absolute-grid position/width fields when moving into FlexContainer.
                delete component.layouts[currentLayout].top;
                delete component.layouts[currentLayout].left;
                delete component.layouts[currentLayout].width;
              } else if (
                oldParentComponentType === 'FlexContainer' &&
                newParentComponentType !== 'FlexContainer' &&
                updateParent
              ) {
                // Moving OUT of FlexContainer: strip flex fields, write grid fields
                const { top, left, width, height } = layout;
                component.layouts[currentLayout] = {
                  ...component.layouts[currentLayout],
                  top,
                  left,
                  width,
                  height,
                };
                delete component.layouts[currentLayout].fillWidth;
                delete component.layouts[currentLayout].widthPx;
              } else {
                component.layouts[currentLayout] = {
                  ...component.layouts[currentLayout],
                  ...layout,
                };
              }
            }
            // ============ Component layout update logic ends ===========

            // ============ Parent update logic ============
            oldParentId = component.component.parent;
            hasParentChanged = oldParentId !== newParentId;
            if (hasParentChanged && updateParent) {
              if (oldParentComponentType === 'FlexContainer' && oldParentId) {
                get().removeFlexContainerChildOrderFromDraft({
                  page,
                  parentId: oldParentId,
                  childId: componentId,
                  flexChildOrderUpdates,
                });
              }

              // Update the component's parent
              component.component.parent = newParentId;
              // Remove the component from the old parent's children list
              if (oldParentId) {
                state.containerChildrenMapping[oldParentId] = state.containerChildrenMapping[oldParentId].filter(
                  (id) => id !== componentId
                );
              } else if (state.containerChildrenMapping[moduleId].includes(componentId)) {
                state.containerChildrenMapping[moduleId] = state.containerChildrenMapping[moduleId].filter(
                  (id) => id !== componentId
                );
              }

              // Add the component to the new parent's children list
              if (newParentId) {
                if (!state.containerChildrenMapping[newParentId]) {
                  state.containerChildrenMapping[newParentId] = [];
                }
                if (!state.containerChildrenMapping[newParentId].includes(componentId)) {
                  state.containerChildrenMapping[newParentId].push(componentId);
                }
                if (newParentComponentType === 'FlexContainer') {
                  get().addFlexContainerChildOrderToDraft({
                    state,
                    page,
                    parentId: newParentId,
                    childId: componentId,
                    flexChildOrderUpdates,
                  });
                }
              } else {
                if (!state.containerChildrenMapping[moduleId].includes(componentId)) {
                  state.containerChildrenMapping[moduleId].push(componentId);
                }
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
        ROW_SCOPED_WIDGET_TYPES.includes(newParentComponentType) ||
        ROW_SCOPED_WIDGET_TYPES.includes(oldParentComponentType)
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

        // // Clean up old dependency graph edges, rebuild deps, and re-resolve for the moved component
        // const rebuildComponentDeps = (cId, comp) => {
        //   // Remove all old dependency edges for this component
        //   removeNode(`components.${cId}`, moduleId);
        //   // Rebuild dependency graph and get fresh resolved values
        //   const resolvedValues = addToDependencyGraph(moduleId, cId, comp);
        //   // Set the resolved store to the flat result (replaces any stale array format)
        //   setResolvedComponent(cId, resolvedValues, moduleId);
        // };

        // rebuildComponentDeps(componentId, component);

        // // Also rebuild all descendant components so their resolved store entries
        // // and dependency graph edges match the new nesting depth
        // const allComponents = get().getCurrentPageComponents(moduleId);
        // const descendants = getAllChildComponents(allComponents, componentId);
        // descendants.forEach((child) => {
        //   const childComp = child.component;
        //   if (childComp?.definition) {
        //     rebuildComponentDeps(child.id, childComp);
        //   }
        // });

        // // After rebuilding deps, trigger the new parent ListView/Kanban's listItem/cardData
        // // dependency update so moved children get re-resolved with correct custom resolvables
        // if (newParentComponentType === 'Listview' || newParentComponentType === 'Kanban') {
        //   const customResolvableKey = newParentComponentType === 'Listview' ? 'listItem' : 'cardData';
        //   // Get the base parent ID (strip any row suffix like -0)
        //   const baseNewParentId = get().getBaseParentId(newParentId);
        //   get().updateDependencyValues(`components.${baseNewParentId}.${customResolvableKey}`, moduleId);
        // }
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
      // Check if we need to batch multiple operations together
      if (updateParent) {
        // Collect all component updates that need to be batched
        let updatedDiff = formFieldsDiff || {};

        Object.entries(flexChildOrderUpdates).forEach(([componentId, childOrder]) => {
          const component = getComponentDefinition(componentId, moduleId)?.component;
          if (component) {
            updatedDiff[componentId] = get().buildFlexChildOrderComponentDiff(component, childOrder);
          }
        });

        // Update container auto-height for both old and new parents
        // Get the diffs to include in the batch operation
        const newParentHeightDiff = updateContainerAutoHeight(newParentId, moduleId, {
          saveAfterAction: false,
          returnDiff: true,
        });
        const oldParentHeightDiff = updateContainerAutoHeight(oldParentId, moduleId, {
          saveAfterAction: false,
          returnDiff: true,
        });

        if (newParentHeightDiff) {
          updatedDiff = { ...updatedDiff, ...newParentHeightDiff };
        }
        if (oldParentHeightDiff) {
          updatedDiff = { ...updatedDiff, ...oldParentHeightDiff };
        }

        // Use batch operations to combine layout changes and component updates in a single API call
        // This creates only one history entry
        const revertParents = () => {
          set(
            (state) => {
              const page = state.modules[moduleId].pages[currentPageIndex];
              if (!page) return;
              Object.entries(oldParentByComponentId).forEach(([componentId, restoredParent]) => {
                const component = page.components[componentId];
                if (!component) return;
                // Restore the pre-drag layout (x/y/w/h) — without this the
                // widget stays at the new-parent coordinates but under the
                // old parent, which renders in the wrong spot.
                const restoredLayout = oldLayoutByComponentId[componentId];
                if (restoredLayout && component.layouts) {
                  component.layouts[currentLayout] = { ...restoredLayout };
                }
                const currentParent = component.component.parent;
                if (currentParent === restoredParent) return;
                component.component.parent = restoredParent;
                // Detach from current parent bucket, reattach to restored parent bucket.
                const currentBucket = currentParent || moduleId;
                if (state.containerChildrenMapping[currentBucket]) {
                  state.containerChildrenMapping[currentBucket] = state.containerChildrenMapping[currentBucket].filter(
                    (id) => id !== componentId
                  );
                }
                const restoreBucket = restoredParent || moduleId;
                if (!state.containerChildrenMapping[restoreBucket]) {
                  state.containerChildrenMapping[restoreBucket] = [];
                }
                if (!state.containerChildrenMapping[restoreBucket].includes(componentId)) {
                  state.containerChildrenMapping[restoreBucket].push(componentId);
                }
              });
            },
            false,
            { type: 'revertLayoutParentsAfterCycleReject' }
          );
        };
        performBatchComponentOperations(
          {
            updated: Object.keys(updatedDiff).length > 0 ? updatedDiff : undefined,
            layout: diff,
          },
          moduleId,
          { onCycleReject: revertParents }
        );
      } else {
        // Simple layout change (resize, move within same parent) - use the regular layout endpoint
        saveComponentChanges(diff, 'components/layout', 'update', moduleId);
        get().multiplayer.broadcastUpdates(diff, 'components/layout', 'update');
      }
    }
  },

  saveComponentPropertyChanges: (componentId, property, value, paramType, attr, moduleId = 'canvas') => {
    const { getCurrentPageIndex, getCurrentMode, saveComponentChanges } = get();
    const currentPageIndex = getCurrentPageIndex(moduleId);
    const currentMode = getCurrentMode(moduleId);
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

    if (currentMode !== 'view') saveComponentChanges(diff, 'components', 'update');

    get().multiplayer.broadcastUpdates({ componentId, property, value, paramType, attr }, 'components', 'update');
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
      getCurrentPageIndex,
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
      saveComponentPropertyChanges,
      findNearestSubcontainerAncestor,
      getCurrentMode,
      getCustomResolvables,
      setResolvedComponentByProperty,
    } = get();
    const currentPageIndex = getCurrentPageIndex(moduleId);
    const componentDef = getComponentDefinition(componentId, moduleId);
    // Safety check: return early if component doesn't exist
    if (!componentDef?.component) {
      return;
    }
    const { component } = componentDef;
    const oldValue = component.definition[paramType][property];
    const parentId = component.parent;
    if (Array.isArray(oldValue?.value)) {
      const resolvedComponent = { [componentId]: deepClone(getResolvedComponent(componentId, null, moduleId) ?? {}) };
      const nearestListviewId = findNearestSubcontainerAncestor(parentId, moduleId);
      const index = nearestListviewId ? 0 : null;
      if (index === null) {
        resolvedComponent[componentId][paramType][property] = [];
      }
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

      if (index !== null) {
        const customResolvables = getCustomResolvables(nearestListviewId, null);
        const length = Object.keys(customResolvables).length;
        const limit = length === 0 ? 1 : length;
        for (let i = 0; i < limit; i++) {
          setResolvedComponentByProperty(
            componentId,
            paramType,
            property,
            resolvedComponent[componentId][i][paramType][property],
            i,
            moduleId
          );
        }
      } else {
        setResolvedComponent(componentId, resolvedComponent[componentId], moduleId);
        // If the value is not changed, return
        if (oldValue?.[attr] === updatedValue || oldValue === updatedValue) return;
      }

      set(
        withUndoRedo((state) => {
          const pageComponent = state.modules[moduleId].pages[currentPageIndex].components[componentId].component;
          lodashSet(pageComponent, ['definition', paramType, property, attr], updatedValue);
        }, skipUndoRedo),
        false,
        'setComponentProperty'
      );

      if (saveAfterAction) {
        saveComponentPropertyChanges(componentId, property, updatedValue, paramType, attr, moduleId);
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

    if (saveAfterAction) {
      saveComponentPropertyChanges(componentId, property, updatedValue, paramType, attr, moduleId);
    }

    if (attr !== 'value' || skipResolve) return;
    if (allRefs.length) {
      generateDependencyGraphForRefs(allRefs, componentId, paramType, property, unResolvedValue, true, moduleId);
    } else {
      const propertyPath = `components.${componentId}.${paramType}.${property}`;
      removeDependency(propertyPath, true, moduleId);
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
      getBaseParentId,
    } = get();

    // Reject self-parenting or descendant-as-new-parent. Covers multiplayer
    // remote parent events and undo/redo replays that bypass the drag UX's
    // ghost guard.
    if (newParentId) {
      const pageComponents = get().modules[moduleId].pages[currentPageIndex].components;
      if (wouldCreateParentCycle(componentId, newParentId, pageComponents, getBaseParentId)) {
        const draggedName = pageComponents[componentId]?.component?.name || componentId;
        toast.error(`Cannot move "${draggedName}" here — it would create a parent-child loop.`);
        return;
      }
    }

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
        } else if (state.containerChildrenMapping[moduleId].includes(componentId)) {
          state.containerChildrenMapping[moduleId] = state.containerChildrenMapping[moduleId].filter(
            (id) => id !== componentId
          );
        }

        // Add the component to the new parent's children list
        if (newParentId) {
          if (!state.containerChildrenMapping[newParentId]) {
            state.containerChildrenMapping[newParentId] = [];
          }
          if (!state.containerChildrenMapping[newParentId].includes(componentId)) {
            state.containerChildrenMapping[newParentId].push(componentId);
          }
        } else {
          if (!state.containerChildrenMapping[moduleId].includes(componentId)) {
            state.containerChildrenMapping[moduleId].push(componentId);
          }
        }
      }, skipUndoRedo),
      false,
      { type: 'setParentComponent', payload: { componentId, newParentId } }
    );

    const newParentComponentType = getComponentTypeFromId(newParentId, moduleId);
    const oldParentComponentType = getComponentTypeFromId(oldParentId, moduleId);

    if (
      ROW_SCOPED_WIDGET_TYPES.includes(newParentComponentType) ||
      ROW_SCOPED_WIDGET_TYPES.includes(oldParentComponentType)
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
      // If the server's authoritative cycle guard rejects this re-parent (e.g.
      // the local snapshot was stale relative to a concurrent edit), put the
      // parent back so the canvas matches what actually persisted.
      const revertParent = () => {
        set(
          (state) => {
            const component = state.modules[moduleId].pages[currentPageIndex].components[componentId];
            if (!component) return;
            component.component.parent = oldParentId ?? null;
            // Re-thread containerChildrenMapping to match the restored parent.
            if (newParentId && state.containerChildrenMapping[newParentId]) {
              state.containerChildrenMapping[newParentId] = state.containerChildrenMapping[newParentId].filter(
                (id) => id !== componentId
              );
            } else if (state.containerChildrenMapping[moduleId]) {
              state.containerChildrenMapping[moduleId] = state.containerChildrenMapping[moduleId].filter(
                (id) => id !== componentId
              );
            }
            const restoreBucket = oldParentId || moduleId;
            if (!state.containerChildrenMapping[restoreBucket]) {
              state.containerChildrenMapping[restoreBucket] = [];
            }
            if (!state.containerChildrenMapping[restoreBucket].includes(componentId)) {
              state.containerChildrenMapping[restoreBucket].push(componentId);
            }
          },
          false,
          { type: 'revertParentAfterCycleReject', payload: { componentId, oldParentId } }
        );
      };
      saveComponentChanges(diff, 'components', 'update', moduleId, { onCycleReject: revertParent });
      get().multiplayer.broadcastUpdates({ componentId, newParentId }, 'components', 'parent');
    }
  },
  setSelectedComponents: (components) => {
    if (components.length === 0) {
      get().clearSelectedComponents();
      return;
    }
    set(
      (state) => {
        state.selectedComponents = components;
        state.isCanvasHeaderSelected = false;
        state.isCanvasFooterSelected = false;
        if (components.length === 1) {
          if (state.isRightSidebarOpen) {
            state.activeRightSideBarTab = RIGHT_SIDE_BAR_TAB.CONFIGURATION;
          }
        }
      },
      false,
      { type: 'setSelectedComponents', payload: { components } }
    );
  },
  setSelectedComponentAsModal: (componentId, moduleId = 'canvas') => {
    if (!componentId) {
      get().clearSelectedComponents();
      return;
    }
    set(
      (state) => {
        state.selectedComponents = componentId ? [componentId] : [];
        state.isCanvasHeaderSelected = false;
        state.isCanvasFooterSelected = false;
        if (state.isRightSidebarOpen) {
          state.activeRightSideBarTab = componentId ? RIGHT_SIDE_BAR_TAB.CONFIGURATION : RIGHT_SIDE_BAR_TAB.COMPONENTS;
        }
      },
      false,
      { type: 'setSelectedComponentAsModal', payload: { componentId } }
    );
  },
  setFocusedParentId: (parentId) => {
    set((state) => {
      state.focusedParentId = parentId;
    }),
      false,
      { type: 'setFocusedParentId', payload: { parentId } };
  },
  saveComponentChanges: (diff, type, operation, moduleId = 'canvas', { onCycleReject } = {}) => {
    set(
      (state) => {
        state.appStore.modules[moduleId].app.isSaving = true;
      },
      false,
      'setAppSavingChanges'
    );
    const { getAppId, currentVersionId, getCurrentPageId } = get();
    const appId = getAppId(moduleId);
    const currentPageId = getCurrentPageId(moduleId);

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
          // handle-response.js rejects with { error: <message string>, data: <full body>, statusCode }.
          // The structured fields (code, componentId) live on `error.data`, not on the message string.
          const errorBody = error?.data || error?.response?.data || error;
          const errorMsg = errorBody?.message || error?.error;
          const isCycleReject =
            errorBody?.code === 'PARENT_CYCLE_DETECTED' ||
            (typeof errorMsg === 'string' && errorMsg.includes('parent-child loop'));
          if (isCycleReject) {
            // Caller-supplied revert restores pre-mutation parent refs locally
            // so the canvas matches the authoritative server state.
            if (typeof onCycleReject === 'function') {
              try {
                onCycleReject();
              } catch (revertErr) {
                console.error('Error reverting after parent-cycle reject:', revertErr);
              }
            }
            toast.error(errorMsg || 'Move rejected: would create a parent-child loop.');
          } else {
            toast.error('App could not be saved.');
          }
          console.error('Error saving component changes:', error);
          resolve(null);
        })
        .finally(() => {
          set(
            (state) => {
              state.appStore.modules[moduleId].app.isSaving = false;
            },
            false,
            'setAppSavingChanges'
          );
        });
    });
  },

  turnOffAutoComputeLayout: async (moduleId = 'canvas') => {
    const { appStore, getCurrentPageId, currentVersionId } = get();
    const app = appStore.modules[moduleId].app;
    const currentPageId = getCurrentPageId(moduleId);
    set(
      (state) => {
        const currentPageIndex = state.modules[moduleId].pages.findIndex((page) => page.id === currentPageId);
        state.modules[moduleId].pages[currentPageIndex].autoComputeLayout = false;
      },
      false,
      'turnOffAutoComputeLayout'
    );

    await savePageChanges(app.appId, currentVersionId, currentPageId, { autoComputeLayout: false });
  },
  setWidgetDeleteConfirmation: (value, isModuleEditor = false) => {
    set((state) => {
      state.showWidgetDeleteConfirmation = value;
      if (value) state.deleteTargetIsModuleEditor = isModuleEditor;
    });
  },

  getCurrentPageId: (moduleId = 'canvas') => get().modules[moduleId].currentPageId,
  getCurrentPageIndex: (moduleId = 'canvas') => get().modules[moduleId].currentPageIndex,

  getComponentsFromAllPages: (moduleId = 'canvas') => {
    const { modules } = get();
    return Object.fromEntries(
      modules[moduleId].pages.flatMap((page) =>
        Object.entries(page.components).map(([id, { component }]) => [id, component.name])
      )
    );
  },

  getCurrentPageComponents: (moduleId = 'canvas') => {
    const { modules, getCurrentPageId } = get();
    const currentPageId = getCurrentPageId(moduleId);
    const currentPageIndex = modules[moduleId].pages.findIndex((page) => page.id === currentPageId);
    return modules[moduleId].pages[currentPageIndex]?.components || [];
  },

  getCurrentPageComponentIds: (moduleId = 'canvas') => {
    const { pages, getCurrentPageId, modules } = get();
    const currentPageId = getCurrentPageId(moduleId);
    const currentPageIndex = modules[moduleId].pages.findIndex((page) => page.id === currentPageId);
    return Object.keys(pages[currentPageIndex]?.components || {});
  },

  getCurrentPage: (moduleId = 'canvas') => {
    const { modules, getCurrentPageId } = get();
    const currentPageId = getCurrentPageId(moduleId);
    const currentPage = modules[moduleId].pages.find((page) => page.id === currentPageId);
    return currentPage;
  },

  // Get the component definition from the component id
  getComponentDefinition: (componentId, moduleId = 'canvas') => {
    const currentPage = get().modules[moduleId].pages.find((page) => page.id === get().getCurrentPageId(moduleId));
    // if (componentId === 'd78554b8-2af0-4add-9d7d-0032bb4c90ce')
    // console.trace('here--- getComponentDefinition--- ', componentId, moduleId, currentPage?.components[componentId]);
    return currentPage?.components[componentId];
  },

  getComponentIdFromName: (componentName, moduleId = 'canvas') => {
    const { modules } = get();
    return modules?.[moduleId]?.componentNameIdMapping?.[componentName];
  },
  // Get the component name from the component id
  getComponentNameFromId: (componentId, moduleId = 'canvas') => {
    const { modules, getCurrentPageIndex } = get();
    const currentPageIndex = getCurrentPageIndex(moduleId);
    return modules[moduleId].pages[currentPageIndex]?.components[componentId]?.component.name;
  },
  getComponentTypeFromId: (componentId, moduleId = 'canvas') => {
    const { modules, getCurrentPageIndex } = get();
    const currentPageIndex = getCurrentPageIndex(moduleId);
    return modules[moduleId].pages[currentPageIndex]?.components[componentId]?.component.component;
  },
  getComponentNameIdMapping: (moduleId = 'canvas') => {
    const { modules } = get();
    return modules[moduleId].componentNameIdMapping;
  },
  getComponentIdNameMapping: (moduleId = 'canvas') => {
    const { getComponentNameIdMapping } = get();
    return Object.fromEntries(Object.entries(getComponentNameIdMapping(moduleId)).map(([name, id]) => [id, name]));
  },
  getSelectedComponentsDefinition: (moduleId = 'canvas') => {
    const { selectedComponents, getCurrentPageComponents } = get();
    const allComponents = getCurrentPageComponents(moduleId);
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
  getQueryIdFromName: (queryName, moduleId = 'canvas') => {
    const { modules } = get();
    return modules[moduleId].queryNameIdMapping[queryName];
  },
  getContainerChildrenMapping: (id) => {
    const { containerChildrenMapping } = get();
    return containerChildrenMapping[id] || [];
  },
  getChildComponents: (parentId, moduleId = 'canvas') => {
    const { getCurrentPageComponents } = get();
    const allComponents = getCurrentPageComponents(moduleId);
    const childComponents = Object.entries(allComponents)
      .filter(([_, component]) => component.component.parent === parentId)
      .reduce((acc, [id, component]) => {
        acc[id] = { component };
        return acc;
      }, {});
    return childComponents;
  },
  applyDependencyUpdate: (
    dependency,
    path,
    moduleId = 'canvas',
    parentIndices = [],
    preloadedExposedValues,
    batchedStateMutations = null
  ) => {
    const {
      getAllExposedValues,
      getNodeData,
      getEntityResolvedValueLength,
      updateChildComponentResolvedValues,
      getComponentTypeFromId,
    } = get();
    const applyOrQueueMutation = (mutator) => {
      if (Array.isArray(batchedStateMutations)) {
        batchedStateMutations.push(mutator);
        return;
      }

      set(
        (state) => {
          mutator(state);
        },
        false,
        'updateDependencyValues'
      );
    };

    // Handle query options sentinel - trigger re-run instead of resolution
    if (dependency.endsWith('.__options__')) {
      const nodeData = getNodeData(dependency, moduleId);
      if (nodeData?.queryId) {
        const query = get().dataQuery?.queries?.modules?.[moduleId]?.find((q) => q.id === nodeData.queryId);
        if (query?.options?.runOnDependencyChange) {
          // Use live name from store (queryIdNameMapping is updated on rename)
          const queryName = get().modules[moduleId]?.queryIdNameMapping?.[nodeData.queryId] || query.name;
          scheduleQueryRerun(nodeData.queryId, queryName, query.kind, moduleId, get);
        }
      }
      return;
    }

    const itemsLength = getEntityResolvedValueLength(dependency, moduleId, parentIndices);
    // If the component is depend on listView/Kanban then update all child components (0 to listItem length) with new value
    if (itemsLength) {
      updateChildComponentResolvedValues(dependency, path, itemsLength, moduleId, parentIndices);
      return;
    }

    const [entityType, entityId, type, ...keys] = dependency.split('.');
    const key = keys.join('.');
    const unResolvedValue = getNodeData(dependency, moduleId);
    const exposedValues = preloadedExposedValues || getAllExposedValues(moduleId);
    const resolvedValue = resolveDynamicValues(unResolvedValue, exposedValues, {}, false, []);

    if (type === undefined) {
      applyOrQueueMutation((state) => {
        // This will set the value for fx on canvas backgroundColor & page settings
        state.resolvedStore.modules[moduleId][entityType][entityId] = resolvedValue;
      });
      return;
    }

    const shouldValidate = entityType === 'components' && entityId;
    const validatedValue = shouldValidate
      ? get().debugger.validateProperty(entityId, type, key, resolvedValue, moduleId)
      : resolvedValue;

    // logic to handle the key like options[0].visible. It will resolve the visible directly and update the resolved store
    if (hasArrayNotation(key)) {
      const keys = parsePropertyPath(key);
      // Triggering a re-render of the table component if any of the dependent component is updated
      // This is done to calculate the callValues in the table component
      // Need to find a better way to handle this
      if (getComponentTypeFromId(entityId, moduleId) === 'Table') {
        applyOrQueueMutation((state) => {
          let entity = state.resolvedStore.modules[moduleId][entityType][entityId];
          if (Array.isArray(entity)) {
            entity = entity[0] || { ...DEFAULT_COMPONENT_STRUCTURE };
            state.resolvedStore.modules[moduleId][entityType][entityId] = entity;
          }
          const currentShouldRender = entity?.properties?.shouldRender ?? 0;
          lodashSet(entity, ['properties', 'shouldRender'], currentShouldRender + 1);
        });
      } else {
        applyOrQueueMutation((state) => {
          let entity = state.resolvedStore.modules[moduleId][entityType][entityId];
          if (Array.isArray(entity)) {
            entity = entity[0] || { ...DEFAULT_COMPONENT_STRUCTURE };
            state.resolvedStore.modules[moduleId][entityType][entityId] = entity;
          }
          lodashSet(
            entity,
            [type, ...keys],
            getComponentTypeFromId(entityId, moduleId) === 'Table' ? unResolvedValue + ' ' : validatedValue
          );
        });
      }
    } else {
      applyOrQueueMutation((state) => {
        let entity = state.resolvedStore.modules[moduleId][entityType][entityId];
        // Guard: stale array format from previous ListView/Kanban parent
        if (Array.isArray(entity)) {
          entity = entity[0] || { ...DEFAULT_COMPONENT_STRUCTURE };
          state.resolvedStore.modules[moduleId][entityType][entityId] = entity;
        }
        if (!entity[type]) {
          entity[type] = {};
        }
        entity[type][key] = validatedValue;
      });
    }
  },

  updateDependencyValuesBatch: (paths = [], moduleId = 'canvas', parentIndices = []) => {
    const { getDependencies, applyDependencyUpdate, getAllExposedValues } = get();
    const uniqueDependencies = new Map();
    const exposedValues = getAllExposedValues(moduleId);
    const batchedStateMutations = [];

    paths.forEach((path) => {
      const dependencies = getDependencies(path, moduleId);
      if (!dependencies?.length) return;

      dependencies.forEach((dependency) => {
        if (!uniqueDependencies.has(dependency)) {
          uniqueDependencies.set(dependency, path);
        }
      });
    });

    uniqueDependencies.forEach((sourcePath, dependency) => {
      applyDependencyUpdate(dependency, sourcePath, moduleId, parentIndices, exposedValues, batchedStateMutations);
    });

    if (batchedStateMutations.length > 0) {
      set(
        (state) => {
          batchedStateMutations.forEach((mutator) => mutator(state));
        },
        false,
        'updateDependencyValuesBatch'
      );
    }
  },

  updateDependencyValues: (path, moduleId = 'canvas', parentIndices = []) => {
    const { getDependencies, applyDependencyUpdate } = get();
    const dependencies = getDependencies(path, moduleId);
    if (!dependencies?.length) return;

    dependencies.forEach((dependency) => {
      applyDependencyUpdate(dependency, path, moduleId, parentIndices);
    });
  },
  computePageSettings: (currentPageSettings) => {
    try {
      const pageSettingMeta = cloneDeep(pageConfig);
      const mergedSettings = merge({}, pageSettingMeta.definition, currentPageSettings);
      return {
        ...pageConfig,
        definition: {
          ...mergedSettings,
        },
      };
    } catch (error) {
      console.log(error);
      return Promise.reject(error);
    }
  },

  getParentIdFromDependency: (dependency, moduleId = 'canvas') => {
    const { getComponentDefinition } = get();
    const componentId = dependency.split('.')[1];
    const component = getComponentDefinition(componentId, moduleId);
    return component?.component?.parent;
  },

  updateChildComponentResolvedValues: (dependency, path, length, moduleId = 'canvas', parentIndices = []) => {
    const {
      getCustomResolvables,
      getNodeData,
      getParentIdFromDependency,
      findNearestSubcontainerAncestor,
      updateRowScope,
    } = get();
    const [entityType, entityId, type, key] = dependency.split('.');
    const parentId = getParentIdFromDependency(dependency, moduleId);
    // Walk up to find the nearest ListView ancestor for customResolvables lookup
    const nearestListviewId = parentId ? findNearestSubcontainerAncestor(parentId, moduleId) : null;
    const resolvableParentId = nearestListviewId || parentId;
    const unResolvedValue = getNodeData(dependency, moduleId);
    const shouldValidate = entityType === 'components' && entityId;

    // Collect all resolved values first, then apply in a single batched store update.
    //
    // Row-scoped resolution: when a dependency like components.checkbox-uuid.value fires,
    // we re-resolve the dependent expression for ALL rows. For each row, updateRowScope
    // swaps the overlay's descendant entries to that row's values, so the resolver sees
    // components['checkbox-uuid'] as a plain object (row-specific) instead of the full array.
    //
    // Note: currently re-resolves all rows even if only one row changed. The store update
    // below is batched, and React skips re-renders for rows where the resolved value didn't
    // change, so the DOM cost is minimal.
    const { scopeCtx, scopedState } = buildRowScopedState({ get, listviewId: resolvableParentId, moduleId });

    // For lazy parents (eg. Table expandable rows),
    // only resolve required rows instead of all 0..length-1.
    // This is a no-op for ListView/Kanban.
    const { isLazyResolvableParent, getLazyRowIndices } = get();
    const isLazy = isLazyResolvableParent(resolvableParentId, moduleId);
    const indicesToResolve = isLazy
      ? getLazyRowIndices(resolvableParentId, moduleId)
      : Array.from({ length }, (_, i) => i);
    if (isLazy && indicesToResolve.length === 0) return;

    const updates = [];
    for (const i of indicesToResolve) {
      const rowCustomResolvables = getCustomResolvables(resolvableParentId, i, moduleId, parentIndices);
      if (scopeCtx) updateRowScope(scopeCtx, i);
      const resolvedValue = resolveDynamicValues(unResolvedValue, scopedState, rowCustomResolvables, false, []);
      const validatedValue = shouldValidate
        ? get().debugger.validateProperty(entityId, type, key, resolvedValue, moduleId)
        : resolvedValue;

      updates.push({ index: i, value: validatedValue });
    }

    // Single batched update instead of N individual set() calls
    set(
      (state) => {
        const entityStore = state.resolvedStore.modules[moduleId][entityType][entityId];
        if (parentIndices.length === 0) {
          updates.forEach(({ index, value }) => {
            // Guard: if entityStore[index] is a stale nested array, unwrap to first element
            if (entityStore[index] && Array.isArray(entityStore[index])) {
              entityStore[index] = entityStore[index][0] || { ...DEFAULT_COMPONENT_STRUCTURE };
            }
            // Also guard entityStore[0] used as template
            const template = Array.isArray(entityStore[0]) ? entityStore[0][0] : entityStore[0];
            if (!entityStore[index]) {
              entityStore[index] = {
                ...template,
                [type]: {
                  ...(template?.[type] || {}),
                  [key]: value,
                },
              };
            } else {
              if (!entityStore[index][type]) {
                entityStore[index][type] = {};
              }
              entityStore[index][type][key] = value;
            }
          });
        } else {
          // Navigate to the correct nested level using parentIndices
          updates.forEach(({ index, value }) => {
            const indices = [...parentIndices, index];
            // Ensure root is an array
            if (!Array.isArray(state.resolvedStore.modules[moduleId][entityType][entityId])) {
              state.resolvedStore.modules[moduleId][entityType][entityId] = [];
            }
            let current = state.resolvedStore.modules[moduleId][entityType][entityId];
            for (let j = 0; j < indices.length - 1; j++) {
              if (!current[indices[j]]) {
                current[indices[j]] = [];
              } else if (!Array.isArray(current[indices[j]])) {
                // Transition flat→nested: wrap existing resolved component in array
                current[indices[j]] = [current[indices[j]]];
              }
              current = current[indices[j]];
            }
            const lastIdx = indices[indices.length - 1];
            // Guard: if current[lastIdx] is a stale nested array, unwrap to first element
            if (current[lastIdx] && Array.isArray(current[lastIdx])) {
              current[lastIdx] = current[lastIdx][0] || { ...DEFAULT_COMPONENT_STRUCTURE };
            }
            if (!current[lastIdx]) {
              // Also guard source (current[0]) if it's an array
              let source = current[0];
              if (source && Array.isArray(source)) {
                source = source[0];
              }
              current[lastIdx] = source
                ? { ...source, [type]: { ...(source[type] || {}), [key]: value } }
                : { ...DEFAULT_COMPONENT_STRUCTURE, [type]: { [key]: value } };
            } else {
              if (!current[lastIdx][type]) {
                current[lastIdx][type] = {};
              }
              current[lastIdx][type][key] = value;
            }
          });
        }
      },
      false,
      'batchUpdateChildComponents'
    );
  },

  getParentComponentType: (parentId, moduleId) => {
    if (!parentId) return null;
    const { modules, getCurrentPageIndex, getBaseParentId } = get();
    const currentPageIndex = getCurrentPageIndex(moduleId);
    // Remove the tab id or any other details from the parent id (ie, -modal, -calendar, -0 from parentId)
    const parentUUID = getBaseParentId(parentId);
    const component = modules[moduleId].pages[currentPageIndex].components[parentUUID];
    if (!component) return null;

    return component.component.component;
  },

  // Return the length of the resolved value of the component.
  // For components inside a ListView, the authoritative row count comes from
  // the nearest ListView ancestor's customResolvables — not from the component's
  // own resolved array, which may still be undersized on refresh (grandchildren
  // are initialised at index 0 only during initDependencyGraph because the
  // ListView data isn't available yet at that point).
  getEntityResolvedValueLength: (dependency, moduleId = 'canvas', parentIndices = []) => {
    const { resolvedStore, getParentIdFromDependency, findNearestSubcontainerAncestor, getCustomResolvables } = get();
    const [entityType, entityId, type, key] = dependency.split('.');
    let data = resolvedStore.modules[moduleId]?.[entityType]?.[entityId];
    if (typeof data === 'string') return undefined;
    // Navigate to nested level if parentIndices are provided
    for (let i = 0; i < parentIndices.length; i++) {
      if (!Array.isArray(data)) return undefined; // Not yet nested, treat as flat
      data = data?.[parentIndices[i]];
      if (!data) return undefined;
    }

    // If the component is inside a ListView, use the ListView's data length
    // so that all rows are resolved even if this component's array hasn't
    // been fully sized yet (e.g. grandchildren on page refresh).
    if (Array.isArray(data)) {
      const parentId = getParentIdFromDependency(dependency, moduleId);
      const nearestListviewId = parentId ? findNearestSubcontainerAncestor(parentId, moduleId) : null;
      if (nearestListviewId) {
        const customResolvables = getCustomResolvables(nearestListviewId, null, moduleId, parentIndices);
        const lvLength = Array.isArray(customResolvables) ? customResolvables.length : 0;
        if (lvLength > 0) return lvLength;
      }
    }

    return data?.length;
  },

  // Returns dependency references for the listItem custom resolvable keyword.
  // Called during dependency graph construction to register what store paths an expression depends on.
  //
  // Note: this function previously also handled the `siblings` keyword, which required mapping
  // siblings.componentName.property → components.<uuid>.property. That handling was removed
  // because sibling references now use the standard {{components.componentName.value}} syntax.
  // The AST already converts component names to UUIDs (components.radiobutton1 → components['uuid']),
  // so these references are registered as normal component dependencies automatically — no special
  // handling needed here. Row-scoping is handled transparently at resolution time via
  // prepareRowScope/updateRowScope.
  getCustomResolvableReference: (value, parentId, moduleId) => {
    const { findNearestSubcontainerAncestor } = get();
    const nearestAncestorId = findNearestSubcontainerAncestor(parentId, moduleId);
    if (!nearestAncestorId) return [];

    const refs = [];

    // listItem — coarse dependency on the ListView.
    // listItem changes atomically (the entire data array is replaced at once via updateCustomResolvables),
    // so property-level tracking (e.g., tracking listItem.name vs listItem.price separately) wouldn't help —
    // all properties change in the same event. One coarse trigger is correct and sufficient.
    if ((value.includes('listItem') && checkSubstringRegex(value, 'listItem')) || value === '{{listItem}}') {
      refs.push({ entityType: 'components', entityNameOrId: nearestAncestorId, entityKey: 'listItem' });
    }

    // cardData — coarse dependency on the Kanban (same pattern as listItem above).
    if ((value.includes('cardData') && checkSubstringRegex(value, 'cardData')) || value === '{{cardData}}') {
      refs.push({ entityType: 'components', entityNameOrId: nearestAncestorId, entityKey: 'cardData' });
    }

    // rowData — coarse dependency on the Table (same pattern as listItem above).
    if ((value.includes('rowData') && checkSubstringRegex(value, 'rowData')) || value === '{{rowData}}') {
      refs.push({ entityType: 'components', entityNameOrId: nearestAncestorId, entityKey: 'rowData' });
    }

    return refs;
  },

  // Walk up from startParentId through component.parent links to find the nearest row-scoped ancestor whose widget type is included in ROW_SCOPED_WIDGET_TYPES.
  // Returns the base UUID of that ancestor, or null if none found.
  findNearestSubcontainerAncestor: (startParentId, moduleId) => {
    const { getBaseParentId, getComponentDefinition } = get();
    const visited = new Set();
    let currentId = startParentId;
    while (currentId) {
      const baseId = getBaseParentId(currentId) || currentId;
      if (visited.has(baseId)) return null;
      visited.add(baseId);
      const def = getComponentDefinition(baseId, moduleId);
      if (!def) return null;
      if (ROW_SCOPED_WIDGET_TYPES.includes(def.component?.component)) return baseId;
      currentId = def.component?.parent;
    }
    return null;
  },

  replaceIdsWithName: (input, moduleId = 'canvas') => {
    const { getComponentsFromAllPages, getQueryIdNameMapping } = get();
    const mappings = {
      components: getComponentsFromAllPages(moduleId), // Getting components from all pages to avoid showing IDs on queries when the component is not on the current page
      queries: getQueryIdNameMapping(moduleId),
    };

    const regex =
      /(components|queries)(\??\.|\??\.?\[['"]?)([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})(['"]?\])?(\??\.|\[['"]?)?([^\s:?[\]'"+\-&|}}]+)?/g;
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
  calculateMoveableBoxHeightWithId: (componentId, currentLayout, stylesDefinition, moduleId = 'canvas') => {
    const componentDefinition = get().getComponentDefinition(componentId, moduleId);
    const layoutData = componentDefinition?.layouts?.[currentLayout];
    const componentType = componentDefinition?.component?.component;
    const label = componentDefinition?.component?.definition?.properties?.label;
    const getAllExposedValues = get().getAllExposedValues;
    // Early return for non input components
    if (![...INPUT_COMPONENTS_FOR_FORM].includes(componentType)) {
      return layoutData?.height;
    }
    const { alignment = { value: null }, auto = { value: null } } = stylesDefinition ?? {};
    const width = stylesDefinition?.width ?? stylesDefinition?.labelWidth ?? { value: null };
    let resolvedLabel = label?.value?.length ?? 0;
    const resolvedWidth = resolveDynamicValues(width?.value + '', getAllExposedValues(moduleId)) ?? 0;
    const resolvedAuto = resolveDynamicValues(auto?.value + '', getAllExposedValues(moduleId)) ?? false;
    const labelType = componentDefinition?.component?.definition?.properties?.labelType;
    const resolvedLabelType = resolveDynamicValues(labelType?.value + '', getAllExposedValues(moduleId)) ?? 'auto';
    if (resolvedLabelType === 'auto') {
      resolvedLabel = 1;
    }

    const resolvedAlignment =
      alignment.value === 'top' || alignment.value === 'side'
        ? alignment.value
        : resolveDynamicValues(alignment.value + '');
    let newHeight = layoutData?.height;

    if (alignment.value && resolvedAlignment === 'top') {
      if ((resolvedLabel > 0 && resolvedWidth > 0) || (resolvedAuto && resolvedWidth === 0 && resolvedLabel > 0)) {
        newHeight += TOP_ALIGNMENT_HEIGHT_INCREMENT;
      }
    }
    return newHeight;
  },
  getIsAutoMobileLayout: (moduleId = 'canvas') => {
    const { getCurrentPage } = get();
    const currentPage = getCurrentPage(moduleId);
    return currentPage?.autoComputeLayout;
  },
  setModalOpenOnCanvas: (modalId, isOpen) => {
    const { modalsOpenOnCanvas } = get();
    let newModalOpenOnCanvas = [];

    if (isOpen) {
      newModalOpenOnCanvas = [...modalsOpenOnCanvas, modalId];
    } else {
      newModalOpenOnCanvas = modalsOpenOnCanvas.filter((id) => id !== modalId);
    }
    set((state) => {
      state.modalsOpenOnCanvas = newModalOpenOnCanvas;
    });
  },
  checkIfComponentIsModule: (componentId, moduleId = 'canvas') =>
    get().getComponentDefinition(componentId, moduleId)?.component?.component === 'ModuleViewer',
  updateContainerAutoHeight: (
    componentId,
    moduleId = 'canvas',
    { saveAfterAction = true, returnDiff = false } = {}
  ) => {
    if (
      !componentId ||
      componentId === 'canvas' ||
      componentId.includes('-header') ||
      componentId.includes('-footer')
    ) {
      return returnDiff ? null : undefined;
    }
    const { currentLayout, getCurrentPageComponents, setComponentProperty, getCurrentPageIndex } = get();
    const allComponents = getCurrentPageComponents();

    const childComponents = getAllChildComponents(allComponents, componentId);
    const maxHeight = Object.values(childComponents).reduce((max, component) => {
      // Added this logic to handle the top alignment for the component
      const top = component?.component?.definition?.styles?.alignment?.value === 'top' ? 20 : 0;
      const layout = component?.layouts?.[currentLayout];
      if (!layout) {
        return max;
      }
      const sum = layout.top + layout.height + top;
      return Math.max(max, sum);
    }, 0);

    const componentDef = getCurrentPageComponents(moduleId)[componentId];
    // If the component doesn't exist, return early (can happen during cross-container moves)
    if (!componentDef?.component) {
      return returnDiff ? null : undefined;
    }
    const currentCanvasHeight = componentDef?.component?.definition?.properties?.canvasHeight?.value;
    if (currentCanvasHeight === maxHeight) {
      return returnDiff ? null : undefined;
    }

    setComponentProperty(componentId, `canvasHeight`, maxHeight, 'properties', 'value', false, moduleId, {
      saveAfterAction,
    });

    // Return the diff if requested (for batching with other operations)
    if (returnDiff) {
      const currentPageIndex = getCurrentPageIndex(moduleId);
      const component = get().modules[moduleId].pages[currentPageIndex].components[componentId]?.component;
      if (component) {
        const { events, exposedVariables, ...filteredDefinition } = component.definition || {};
        return {
          [componentId]: {
            component: {
              ...component,
              definition: filteredDefinition,
            },
          },
        };
      }
    }
  },

  /**
   * Generates a unique component name from the base name by appending a number if necessary.
   * @param {string} baseName - The base name for the component
   * @returns {string} Unique component name
   */
  generateUniqueComponentNameFromBaseName: (baseName, moduleId = 'canvas') => {
    const { getComponentNameIdMapping } = get();
    const componentNameIdMapping = getComponentNameIdMapping(moduleId);

    let uniqueName = baseName;
    let counter = 1;

    while (Object.keys(componentNameIdMapping).includes(uniqueName)) {
      uniqueName = `${baseName}${counter}`;
      counter++;
    }

    return uniqueName;
  },
  buildComponentDefinition: (componentDefinitions, moduleId = 'canvas') => {
    const { getCurrentPageComponents } = get();
    return componentDefinitions.reduce((acc, componentDefinition) => {
      const currentComponents = {
        ...getCurrentPageComponents(moduleId),
        ...Object.fromEntries(acc.map((component) => [component.id, component])),
      };

      // When component is dropped on canvas for the first time
      // In default component definition, .name holds the correct computed name for eg. button1
      // Whereas .component.name holds the default component name without any computation for eg. Button
      // Also .name is undefined when we reload app and fetch components from the backend. Hence below mentioned OR condition
      const initialComponentName = componentDefinition.name || componentDefinition.component.name;

      // Check if there is any existing component with the same name
      const isExistingName = Object.values(currentComponents).some(
        (component) => component.component.name === initialComponentName
      );

      // If name is valid then use the same name but if not then fallback to old flow and compute component name
      const componentName = !isExistingName
        ? initialComponentName
        : computeComponentName(componentDefinition.component.component, currentComponents);

      const getComponentProperties = (componentDefinition) => {
        const properties = componentDefinition.component.definition?.properties;
        const componentType = componentDefinition.component.component;
        if (componentType === 'CircularProgressBar') {
          return {
            ...properties,
            text: {
              value: `{{components.${componentDefinition.id}.value}}%`,
            },
          };
        } else if (componentType === 'ProgressBar') {
          return {
            ...properties,
            label: {
              value: `{{components.${componentDefinition.id}.value}}%`,
            },
          };
        }
        return properties;
      };

      const newComponent = {
        id: componentDefinition.id,
        name: componentName,
        component: {
          component: componentDefinition.component.component,
          definition: {
            general: componentDefinition.component.definition?.general,
            generalStyles: componentDefinition.component.definition?.generalStyles,
            others: componentDefinition.component.definition?.others,
            properties: getComponentProperties(componentDefinition),
            styles: componentDefinition.component.definition?.styles,
            validation: componentDefinition.component.definition?.validation,
          },
          name: componentName,
          displayName: componentDefinition.component.displayName,
          parent: componentDefinition.component.parent,
        },
        layouts: componentDefinition.layouts,
      };

      return [...acc, newComponent];
    }, []);
  },
  toggleComponentPermissionModal: (show) => {
    set((state) => {
      state.showComponentPermissionModal = show;
    });
  },
  setComponentPermission: (componentId, data) => {
    const { modules } = get();
    const currentPageIndex = modules.canvas.currentPageIndex;
    const component = modules.canvas.pages[currentPageIndex]?.components?.[componentId];

    if (component) {
      const updatedComponent = {
        ...component,
        permissions: data.length === 0 || data.length === undefined ? [] : [data[0]],
      };

      set((state) => {
        state.modules.canvas.pages[currentPageIndex].components[componentId] = updatedComponent;
      });
    }
  },
  computeColorForPopoverMenu: (value, meta, componentId) => {
    const { getResolvedComponent } = get();
    const component = getResolvedComponent(componentId);
    const buttonType = component?.properties?.buttonType;
    if (buttonType == 'primary') return value;
    else {
      if (meta.displayName == 'Text') {
        return value == '#FFFFFF' ? 'var(--cc-primary-text)' : value;
      } else if (meta.displayName == 'Border') {
        return value == 'var(--cc-primary-brand)' ? 'var(--cc-default-border)' : value;
      } else if (meta.displayName == 'Icon color') {
        return value == '#FFFFFF' ? 'var(--cc-default-icon)' : value;
      }
    }
    return value;
  },
  performDeletionUpdationAndCreationOfComponentsInPages: (pagesInfo, moduleId = 'canvas') => {
    const {
      deleteComponents,
      getCurrentPageId,
      setComponentPropertyByComponentIds,
      addComponentToCurrentPage,
      deletePage,
    } = get();

    const currentPageId = getCurrentPageId(moduleId);

    Object.entries(pagesInfo).forEach(([action, pages]) => {
      switch (action) {
        case 'create': {
          if (!(Array.isArray(pages) && pages.length)) return;

          const formattedPages = pages.map((page) => {
            if (page.components) {
              return {
                ...page,
                components:
                  page.components?.create?.reduce((componentMapById, comp) => {
                    const { id, component, layouts } = comp;

                    if (id) {
                      componentMapById[id] = { id, component, layouts, name: component?.name ?? '' };
                    }

                    return componentMapById;
                  }, {}) ?? {},
              };
            }

            return { ...page, components: {} };
          });

          set(
            (state) => {
              state.modules[moduleId].pages.push(...formattedPages);
            },
            false,
            'addNewPages'
          );
          break;
        }
        case 'update': {
          if (pages?.length) {
            pages.forEach((item) => {
              if (item?.id) {
                const { components, ...restOfPageProperties } = item;

                if (item.id === currentPageId) {
                  const componentIdsToDelete = Array.isArray(components?.delete) ? components.delete : [];

                  const componentsToUpdate =
                    components?.update?.reduce((acc, comp) => {
                      acc[comp.id] = comp;
                      return acc;
                    }, {}) ?? {};

                  // Convert create operations format to match addComponentToCurrentPage expectations
                  const componentsToCreate = (components?.create ?? []).map((component) => ({
                    id: component.id,
                    name: component.component?.name,
                    component: component.component,
                    layouts: component.layouts,
                  }));

                  // Update page properties except components
                  set(
                    (state) => {
                      const page = state.modules[moduleId].pages.find((p) => p.id === item.id);

                      if (page) Object.assign(page, restOfPageProperties);
                    },
                    false,
                    'updateCurrentPageProperties'
                  );

                  // Delete Components
                  componentIdsToDelete.length &&
                    deleteComponents(componentIdsToDelete, moduleId, { saveAfterAction: false });

                  // Update Components
                  !isEmpty(componentsToUpdate) &&
                    setComponentPropertyByComponentIds(componentsToUpdate, moduleId, { saveAfterAction: false });

                  // Create Components
                  componentsToCreate.length &&
                    addComponentToCurrentPage(componentsToCreate, moduleId, {
                      saveAfterAction: false,
                      skipFormUpdate: true,
                    });
                } else {
                  const componentIdsToDelete = Array.isArray(components?.delete) ? components.delete : [];
                  const componentsToUpdate = components?.update ?? [];
                  const componentsToCreate = components?.create ?? [];

                  set(
                    (state) => {
                      const pageToUpdate = state.modules[moduleId].pages.find((p) => p.id === item.id) ?? null;

                      if (!pageToUpdate) return;

                      // Update page properties except components
                      Object.assign(pageToUpdate, restOfPageProperties);

                      if (!pageToUpdate.components) pageToUpdate.components = {};
                      const componentsInState = pageToUpdate.components;

                      // Delete components
                      componentIdsToDelete.forEach((id) => {
                        delete componentsInState[id];
                      });

                      // Update components
                      componentsToUpdate.forEach((componentToUpdate) => {
                        componentsInState[componentToUpdate.id] = componentToUpdate;
                      });

                      // Create/Add components
                      componentsToCreate.forEach((component) => {
                        componentsInState[component.id] = {
                          component: component.component,
                          layouts: component.layouts,
                          id: component.id,
                          name: component.component?.name,
                        };
                      });
                    },
                    undefined,
                    'performDeletionUpdationAndCreationOfComponentsInPages'
                  );
                }
              }
            });
          }

          break;
        }
        case 'delete': {
          if (!pages?.length) return;

          pages.forEach((pageIdToDelete) => {
            deletePage(pageIdToDelete, { saveAfterAction: false });
          });

          break;
        }
        default:
          break;
      }
    });
  },
  getExposedPropertyForAdditionalActions: (componentId, indices, property, moduleId = 'canvas') => {
    const { getExposedValueOfComponent, getComponentTypeFromId, getComponentDefinition, getBaseParentId } = get();
    const component = getComponentDefinition(componentId, moduleId)?.component;
    const componentName = component?.name;
    const parentId = component?.parent;
    // Strip row suffix to get the actual ListView ID (e.g., 'listview-abc-0' → 'listview-abc')
    const baseParentId = getBaseParentId?.(parentId) || parentId;
    const parentType = getComponentTypeFromId(baseParentId);

    // Normalize indices: accept both scalar (legacy) and array (N-level) formats
    // For ListView, we use the last index (immediate parent's row index)
    const lastIndex = Array.isArray(indices) ? indices[indices.length - 1] : indices;

    if (parentType === 'Listview') {
      let parentComponent = getExposedValueOfComponent(baseParentId, moduleId);
      if (lastIndex == null) {
        return undefined;
      }
      // For nested Listviews (Listview-inside-Listview), the parent Listview's
      // exposed value is itself an array indexed by outer-row indices — each
      // outer-row entry holds a separate `{ children: [...] }` structure for
      // that row's copy of the inner Listview. Walk through every index
      // except the last to reach the correct leaf, then index `children`
      // with the last (immediate-row) index. Without this traversal the
      // lookup falls through at the array level and returns undefined, which
      // makes callers like `resolveContainerHeight` (Accordion's
      // `isExpanded` check) treat the component as its default state
      // (expanded) regardless of actual runtime state.
      const outerIndices = Array.isArray(indices) ? indices.slice(0, -1) : [];
      for (const idx of outerIndices) {
        parentComponent = parentComponent?.[idx];
        if (parentComponent == null) {
          return undefined;
        }
      }
      const subcontainerParentComponent = parentComponent?.children?.[lastIndex];
      return subcontainerParentComponent?.[componentName]?.[property];
    } else if (parentType === 'Form') {
      const parentComponent = getExposedValueOfComponent(baseParentId, moduleId);
      const subcontainerParentComponent = parentComponent?.children?.[componentName];
      return subcontainerParentComponent?.[property];
    } else {
      const componentExposedProperty = getExposedValueOfComponent(componentId, moduleId)?.[property];
      return componentExposedProperty;
    }
  },

  getCurrentAdditionalActionValue: (
    componentId,
    subContainerIndex,
    property,
    fallbackProperty,
    moduleId = 'canvas'
  ) => {
    const { getResolvedComponent, getExposedPropertyForAdditionalActions } = get();
    const component = getResolvedComponent(componentId, subContainerIndex, moduleId);
    const componentExposedProperty = getExposedPropertyForAdditionalActions(
      componentId,
      subContainerIndex,
      property,
      moduleId
    );
    if (componentExposedProperty !== undefined) return componentExposedProperty;
    return component?.properties?.[fallbackProperty] || component?.styles?.[fallbackProperty];
  },
  getComponentAlignment: (componentId, moduleId = 'canvas') => {
    const { getResolvedComponent } = get();
    const component = getResolvedComponent(componentId, null, moduleId);
    return component?.styles?.alignment;
  },
  getComponentLabel: (componentId, moduleId = 'canvas') => {
    const { getResolvedComponent } = get();
    const component = getResolvedComponent(componentId, null, moduleId);
    return component?.properties?.label;
  },
});
