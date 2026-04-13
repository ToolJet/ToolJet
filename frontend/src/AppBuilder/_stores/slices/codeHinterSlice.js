import { createJavaScriptSuggestions } from '@/AppBuilder/CodeEditor/utils';
import { ACTIONS } from '@/AppBuilder/_stores/constants/actions';

/**
 * Module-level single-entry caches for context hints.
 *
 * These live OUTSIDE the Zustand/Immer-managed state intentionally:
 * Immer freezes state objects, so caching inside the store would cause
 * "Cannot add property, object is not extensible" errors when getContextHints
 * tries to update the cache.
 *
 * Single-entry (not a map) because only one CodeHinter can be focused at a time,
 * so we only ever need the last-computed result. This bounds memory to at most
 * two small objects regardless of app size.
 *
 * Invalidated by incrementing `_contextHintsVersion` in the store (which causes
 * a version mismatch on next access) or by explicitly setting to null in
 * `invalidateContextHintsCache`.
 */
let _contextHintsCache = null; // { id: componentId, version: number, hints: Array }
let _tableContextHintsCache = null; // { id: tableId, version: number, hints: Array }

/**
 * Recursively traverses an object to produce flat hint entries for autocomplete.
 * Each entry is { hint: 'dotted.path', type: 'Object'|'Array'|'String'|etc }.
 *
 * Mirrors the old createReferencesLookup / buildMap logic from _stores/utils.js.
 * For arrays with >= 10 elements, only row 0 is used as a structural template
 * (same optimization as the legacy code — avoids traversing thousands of rows).
 */
function traverseObjectToHints(data, prefix, maxDepth = 3, _depth = 0) {
  const hints = [];
  if (_depth >= maxDepth || data == null || typeof data !== 'object') return hints;

  const keys = Object.keys(data);
  keys.forEach((key) => {
    const value = data[key];
    const _type = Object.prototype.toString.call(value).slice(8, -1);
    const newPath = prefix ? `${prefix}.${key}` : key;

    hints.push({ hint: newPath, type: _type });

    if (_type === 'Object') {
      hints.push(...traverseObjectToHints(value, newPath, maxDepth, _depth + 1));
    } else if (_type === 'Array') {
      // Same optimization as old code: arrays >= 10 elements use row 0 as template
      const template = value.length >= 10 ? value[0] : value;
      if (template && typeof template === 'object') {
        hints.push(...traverseObjectToHints(template, newPath, maxDepth, _depth + 1));
      }
    }
  });

  return hints;
}

/** Build hints for all components in the given module. Handles per-row arrays (ListView/Kanban children). */
function buildComponentHints(storeState, moduleId) {
  const hints = [];
  const { modules, resolvedStore } = storeState;
  const componentNameIdMapping = modules[moduleId]?.componentNameIdMapping || {};
  const exposedComponents = resolvedStore.modules[moduleId]?.exposedValues?.components || {};

  Object.entries(componentNameIdMapping).forEach(([name, id]) => {
    const componentData = exposedComponents[id];
    if (!componentData) {
      hints.push({ hint: `components.${name}`, type: 'Object' });
      return;
    }

    // Handle per-row arrays (ListView/Kanban children) — unwrap and use row 0 as template
    let dataToTraverse = componentData;
    if (Array.isArray(componentData)) {
      dataToTraverse = componentData[0] || {};
    }

    hints.push({ hint: `components.${name}`, type: 'Object' });
    hints.push(...traverseObjectToHints(dataToTraverse, `components.${name}`, 3));
  });

  return hints;
}

/** Build hints for all queries in the given module, including .run() and .reset() method hints. */
function buildQueryHints(storeState, moduleId) {
  const hints = [];
  const { modules, resolvedStore } = storeState;
  const queryNameIdMapping = modules[moduleId]?.queryNameIdMapping || {};
  const exposedQueries = resolvedStore.modules[moduleId]?.exposedValues?.queries || {};

  Object.entries(queryNameIdMapping).forEach(([name, id]) => {
    const queryData = exposedQueries[id];
    hints.push({ hint: `queries.${name}`, type: 'Object' });
    hints.push({ hint: `queries.${name}.run()`, type: 'Function' });
    hints.push({ hint: `queries.${name}.reset()`, type: 'Function' });

    if (queryData && typeof queryData === 'object') {
      hints.push(...traverseObjectToHints(queryData, `queries.${name}`, 3));
    }
  });

  return hints;
}

function buildVariableHints(storeState, moduleId) {
  const hints = [];
  const exposedValues = storeState.resolvedStore.modules[moduleId]?.exposedValues || {};

  // variables
  const variables = exposedValues.variables || {};
  if (Object.keys(variables).length > 0) {
    hints.push({ hint: 'variables', type: 'Object' });
    hints.push(...traverseObjectToHints(variables, 'variables', 3));
  }

  // page.variables
  const page = exposedValues.page || {};
  if (page && typeof page === 'object') {
    hints.push({ hint: 'page', type: 'Object' });
    hints.push(...traverseObjectToHints(page, 'page', 3));
  }

  return hints;
}

function buildPageHints(storeState, moduleId) {
  const hints = [];
  const exposedValues = storeState.resolvedStore.modules[moduleId]?.exposedValues || {};

  // constants
  const constants = exposedValues.constants || {};
  if (Object.keys(constants).length > 0) {
    hints.push({ hint: 'constants', type: 'Object' });
    hints.push(...traverseObjectToHints(constants, 'constants', 3));
  }

  // input (for modules)
  const input = exposedValues.input;
  if (input && typeof input === 'object' && Object.keys(input).length > 0) {
    hints.push({ hint: 'input', type: 'Object' });
    hints.push(...traverseObjectToHints(input, 'input', 3));
  }

  return hints;
}

function buildGlobalHints(storeState, moduleId) {
  const hints = [];
  const globals = storeState.resolvedStore.modules[moduleId]?.exposedValues?.globals || {};

  if (Object.keys(globals).length > 0) {
    hints.push({ hint: 'globals', type: 'Object' });
    hints.push(...traverseObjectToHints(globals, 'globals', 3));
  }

  return hints;
}

function buildActionHints() {
  return ACTIONS.map((action) => ({ hint: `actions.${action}()`, type: 'method' }));
}

/**
 * Compute a structural "shape hash" of an object for comparison.
 * Returns a string like "{id:Number,name:String,items:[{price:Number}]}".
 *
 * Used by rebuildQueryHints to skip rebuilding when a query re-runs but its
 * result shape hasn't changed (e.g., same columns, different row values).
 * This avoids unnecessary hint recomputation on frequent query polling.
 */
function computeShapeHash(obj, maxDepth = 3, _depth = 0) {
  if (_depth >= maxDepth || obj == null) return typeof obj;
  const type = Object.prototype.toString.call(obj).slice(8, -1);

  if (type === 'Array') {
    if (obj.length === 0) return '[]';
    return `[${computeShapeHash(obj[0], maxDepth, _depth + 1)}]`;
  }

  if (type === 'Object') {
    const keys = Object.keys(obj).sort();
    const entries = keys.map((k) => `${k}:${computeShapeHash(obj[k], maxDepth, _depth + 1)}`);
    return `{${entries.join(',')}}`;
  }

  return type;
}

/**
 * Initial state for the code hinter slice.
 *
 * Architecture: Instead of one monolithic flat array rebuilt on every change,
 * hints are split into independently-rebuildable segments. When e.g. a variable
 * changes, only `segments.variables` is recomputed and then all segments are
 * merged into `appHints`. This replaces the old flag-and-debounce pattern
 * (BuildSuggestions component with 3-second setTimeout).
 */
const initialState = {
  suggestions: {
    segments: {
      components: [],
      queries: [],
      variables: [],
      globals: [],
      page: [],
      actions: [],
    },
    jsHints: {},
    appHints: [], // Merged cache of all segments — used by getSuggestions()
  },
  _queryShapeHashes: {}, // queryId → shape string, for skipping redundant query hint rebuilds
  _contextHintsVersion: 0, // Bumped when customResolvables or component exposed values change; invalidates context hint caches
};

export const createCodeHinterSlice = (set, get) => ({
  ...initialState,

  // ─── Segment Builders ──────────────────────────────────────────────

  invalidateContextHintsCache: () => {
    set(
      (draft) => {
        draft._contextHintsVersion += 1;
      },
      false,
      'invalidateContextHintsCache'
    );
    _contextHintsCache = null;
    _tableContextHintsCache = null;
  },

  rebuildComponentHints: (moduleId = 'canvas') => {
    const state = get();
    const componentHints = buildComponentHints(state, moduleId);
    set(
      (draft) => {
        draft.suggestions.segments.components = componentHints;
        draft.suggestions.appHints = mergeAllSegments(draft.suggestions.segments);
        draft._contextHintsVersion += 1;
      },
      false,
      'rebuildComponentHints'
    );
  },

  rebuildQueryHints: (moduleId = 'canvas', queryId = null) => {
    const state = get();

    // Phase 4: shape-based skip when a specific queryId is provided
    if (queryId) {
      const exposedQueries = state.resolvedStore.modules[moduleId]?.exposedValues?.queries || {};
      const queryData = exposedQueries[queryId];
      if (queryData) {
        const newHash = computeShapeHash(queryData);
        const oldHash = state._queryShapeHashes[queryId];
        if (newHash === oldHash) return; // shape unchanged, skip rebuild
        set(
          (draft) => {
            draft._queryShapeHashes[queryId] = newHash;
          },
          false,
          'updateQueryShapeHash'
        );
      }
    }

    const queryHints = buildQueryHints(state, moduleId);
    set(
      (draft) => {
        draft.suggestions.segments.queries = queryHints;
        draft.suggestions.appHints = mergeAllSegments(draft.suggestions.segments);
      },
      false,
      'rebuildQueryHints'
    );
  },

  rebuildVariableHints: (moduleId = 'canvas') => {
    const state = get();
    const variableHints = buildVariableHints(state, moduleId);
    set(
      (draft) => {
        draft.suggestions.segments.variables = variableHints;
        draft.suggestions.appHints = mergeAllSegments(draft.suggestions.segments);
      },
      false,
      'rebuildVariableHints'
    );
  },

  rebuildGlobalHints: (moduleId = 'canvas') => {
    const state = get();
    const globalHints = buildGlobalHints(state, moduleId);
    set(
      (draft) => {
        draft.suggestions.segments.globals = globalHints;
        draft.suggestions.appHints = mergeAllSegments(draft.suggestions.segments);
      },
      false,
      'rebuildGlobalHints'
    );
  },

  rebuildPageHints: (moduleId = 'canvas') => {
    const state = get();
    const pageHints = buildPageHints(state, moduleId);
    set(
      (draft) => {
        draft.suggestions.segments.page = pageHints;
        draft.suggestions.appHints = mergeAllSegments(draft.suggestions.segments);
      },
      false,
      'rebuildPageHints'
    );
  },

  // ─── Full Initialization ───────────────────────────────────────────

  initSuggestions: (moduleId = 'canvas') => {
    const state = get();
    const segments = {
      components: buildComponentHints(state, moduleId),
      queries: buildQueryHints(state, moduleId),
      variables: buildVariableHints(state, moduleId),
      globals: buildGlobalHints(state, moduleId),
      page: buildPageHints(state, moduleId),
      actions: buildActionHints(),
    };
    const jsHints = createJavaScriptSuggestions();
    const appHints = mergeAllSegments(segments);

    set(
      (draft) => {
        draft.suggestions.segments = segments;
        draft.suggestions.jsHints = jsHints;
        draft.suggestions.appHints = appHints;
        draft._queryShapeHashes = {};
        draft._contextHintsVersion += 1;
      },
      false,
      'initSuggestions'
    );
  },

  // ─── Getter (backward compat) ─────────────────────────────────────

  getSuggestions: () => {
    const { suggestions } = get();
    return {
      appHints: suggestions.appHints,
      jsHints: suggestions.jsHints,
    };
  },

  // ─── Context-Aware Hints ────────────────────────────────────────────
  //
  // These provide autocomplete suggestions that are only relevant within
  // a specific component's context:
  //   - `listItem` for components inside a ListView
  //   - `cardData` for components inside a Kanban
  //   - Row-scoped sibling components (other children of the same ListView/Kanban)
  //   - `rowData`/`cellValue` for table column editors
  //
  // Results are cached at module level (see top of file) with version-based
  // invalidation, so repeated calls from the same focused editor are free.

  getContextHints: (componentId, moduleId = 'canvas') => {
    if (!componentId) return [];

    const state = get();
    const version = state._contextHintsVersion;
    if (_contextHintsCache && _contextHintsCache.id === componentId && _contextHintsCache.version === version)
      return _contextHintsCache.hints;

    const {
      getComponentDefinition,
      getBaseParentId,
      getParentComponentType,
      containerChildrenMapping,
      resolvedStore,
      modules,
    } = state;

    const componentDef = getComponentDefinition(componentId, moduleId);
    if (!componentDef) return [];

    const hints = [];
    const customResolvables = resolvedStore.modules[moduleId]?.customResolvables || {};
    const exposedComponents = resolvedStore.modules[moduleId]?.exposedValues?.components || {};
    const componentNameIdMapping = modules[moduleId]?.componentNameIdMapping || {};
    const reverseMapping = Object.fromEntries(Object.entries(componentNameIdMapping).map(([name, id]) => [id, name]));

    // Walk the ancestor chain upward to find ListView/Kanban parents.
    // For each one found, extract listItem/cardData from customResolvables.
    let currentParentId = componentDef.component?.parent;
    let nearestListViewOrKanbanId = null;

    while (currentParentId) {
      const baseParentId = getBaseParentId(currentParentId);
      const parentType = getParentComponentType(currentParentId, moduleId);

      if (parentType === 'Listview') {
        nearestListViewOrKanbanId = nearestListViewOrKanbanId || baseParentId;
        const resolvables = customResolvables[baseParentId];
        if (resolvables && resolvables[0]?.listItem !== undefined) {
          const listItemData = resolvables[0].listItem;
          hints.push({ hint: 'listItem', type: 'Object', isContext: true });
          hints.push(
            ...traverseObjectToHints(listItemData, 'listItem', 3).map((h) => ({
              ...h,
              isContext: true,
            }))
          );
        }
      } else if (parentType === 'Kanban') {
        nearestListViewOrKanbanId = nearestListViewOrKanbanId || baseParentId;
        const resolvables = customResolvables[baseParentId];
        if (resolvables && resolvables[0]?.cardData !== undefined) {
          const cardData = resolvables[0].cardData;
          hints.push({ hint: 'cardData', type: 'Object', isContext: true });
          hints.push(
            ...traverseObjectToHints(cardData, 'cardData', 3).map((h) => ({
              ...h,
              isContext: true,
            }))
          );
        }
      }

      // Move up the chain
      const parentDef = getComponentDefinition(baseParentId, moduleId);
      currentParentId = parentDef?.component?.parent || null;
    }

    // Row-scoped siblings: other children of the nearest ListView/Kanban.
    // These are tagged with isRowScoped so they appear in a separate
    // "Row-scoped siblings" section in the autocomplete dropdown.
    if (nearestListViewOrKanbanId) {
      const siblingIds = containerChildrenMapping[nearestListViewOrKanbanId] || [];
      siblingIds.forEach((sibId) => {
        if (sibId === componentId) return; // skip self
        const sibName = reverseMapping[sibId];
        if (!sibName) return;

        const sibExposed = exposedComponents[sibId];
        if (!sibExposed) return;

        // Per-row array — use row 0 as template
        const template = Array.isArray(sibExposed) ? sibExposed[0] || {} : sibExposed;

        hints.push({ hint: `components.${sibName}`, type: 'Object', isRowScoped: true });
        hints.push(
          ...traverseObjectToHints(template, `components.${sibName}`, 3).map((h) => ({
            ...h,
            isRowScoped: true,
          }))
        );
      });
    }

    _contextHintsCache = { id: componentId, version, hints };
    return hints;
  },

  /**
   * Context hints for table column editors (e.g., transformation, cell styles).
   * Provides `rowData.*` hints (from first row of currentData) and `cellValue`.
   * The tableId is provided via TableColumnContext (React Context set at ColumnPopover level).
   */
  getTableColumnContextHints: (tableId, moduleId = 'canvas') => {
    const state = get();
    const version = state._contextHintsVersion;
    if (
      _tableContextHintsCache &&
      _tableContextHintsCache.id === tableId &&
      _tableContextHintsCache.version === version
    )
      return _tableContextHintsCache.hints;

    const exposedComponents = state.resolvedStore.modules[moduleId]?.exposedValues?.components || {};
    const tableData = exposedComponents[tableId];
    if (!tableData) return [];

    const currentData = tableData.currentData;
    if (!Array.isArray(currentData) || currentData.length === 0) return [];

    const sampleRow = currentData[0];
    const hints = [
      { hint: 'rowData', type: 'Object', isContext: true },
      ...traverseObjectToHints(sampleRow, 'rowData', 3).map((h) => ({
        ...h,
        isContext: true,
      })),
      { hint: 'cellValue', type: 'String', isContext: true },
    ];

    _tableContextHintsCache = { id: tableId, version, hints };
    return hints;
  },

  // ─── Server-side Global Resolve ────────────────────────────────────

  getServerSideGlobalResolveSuggestions: (isInsideQueryManager) => {
    const isServerSideGlobalResolveEnabled = !!get()?.license?.featureAccess?.serverSideGlobalResolve;
    const serverHints = [];
    const hints = get().getSuggestions();
    if (isInsideQueryManager && isServerSideGlobalResolveEnabled) {
      serverHints.push({ hint: 'globals.server', type: 'Object' });
      hints?.appHints?.forEach((appHint) => {
        if (appHint?.hint?.startsWith('globals.currentUser')) {
          const key = appHint?.hint?.replace('globals.currentUser', 'globals.server.currentUser');
          serverHints.push({
            hint: key,
            type: appHint?.type,
          });
        }
      });
    }

    return serverHints;
  },
});

// ─── Helper ──────────────────────────────────────────────────────────

function mergeAllSegments(segments) {
  return [
    ...segments.components,
    ...segments.queries,
    ...segments.variables,
    ...segments.globals,
    ...segments.page,
    ...segments.actions,
  ];
}
