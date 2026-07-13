import { extractQueryReferences } from '@/AppBuilder/_utils/queryPanel';
import { extractAndReplaceReferencesFromString } from '@/AppBuilder/_stores/ast';
import { getQueryCodeAnalyses, ScriptAnalysis } from '@/AppBuilder/_utils/scriptAnalysis';

/**
 * Read-only usage selectors for the Dependency Viewer.
 *
 * Answers "what does this entity use / who uses it" for components and queries by
 * combining two sources:
 *  - the runtime dependency graph (component property bindings are always registered there)
 *  - on-demand extraction of {{}} refs from query options (query→entity edges only exist
 *    in the graph when runOnDependencyChange is enabled, so they are computed here instead)
 *
 * Never writes to the dependency graph or the resolved store.
 */

export type UsageEntryKind =
  | 'component'
  | 'query'
  | 'variable'
  | 'pageVariable'
  | 'global'
  | 'constant'
  | 'page'
  | 'action'
  | 'unknown';

export type UsageEntry = {
  kind: UsageEntryKind;
  id: string | null;
  name: string;
  details: string[];
};

const PARAM_TYPES = new Set(['properties', 'general', 'generalStyles', 'others', 'styles', 'validation']);
const QUERY_EVENT_ACTIONS = new Set(['run-query', 'reset-query', 'abort-query']);

// Event actions that target another component; extractor returns the target component id.
const COMPONENT_EVENT_TARGETS: Record<string, (action: any) => string | undefined> = {
  'control-component': (action) => action.componentId,
  'show-modal': (action) => action.modal?.id ?? action.modal,
  'close-modal': (action) => action.modal?.id ?? action.modal,
  'set-table-page': (action) => action.table?.id ?? action.table,
  'scroll-component-into-view': (action) => action.componentId,
};

// Event actions that write app/page variables; value is the variable entry kind.
const VARIABLE_EVENT_TARGETS: Record<string, UsageEntryKind> = {
  'set-custom-variable': 'variable',
  'unset-custom-variable': 'variable',
  'set-page-variable': 'pageVariable',
  'unset-page-variable': 'pageVariable',
};

const getGraph = (state: any, moduleId: string) => state.dependencyGraph?.modules?.[moduleId]?.graph;
const getQueries = (state: any, moduleId: string) => state.dataQuery?.queries?.modules?.[moduleId] ?? [];
const getEvents = (state: any, moduleId: string) => state.eventsSlice?.module?.[moduleId]?.events ?? [];
const getQueryName = (state: any, id: string, moduleId: string) =>
  state.modules?.[moduleId]?.queryIdNameMapping?.[id];
const getComponentName = (state: any, id: string, moduleId: string) =>
  state.getComponentDefinition?.(id, moduleId)?.component?.name;

function addEntry(map: Map<string, UsageEntry>, kind: UsageEntryKind, id: string | null, name: string, detail?: string) {
  const key = `${kind}:${id ?? name}`;
  let entry = map.get(key);
  if (!entry) {
    entry = { kind, id, name, details: [] };
    map.set(key, entry);
  }
  if (detail && !entry.details.includes(detail)) entry.details.push(detail);
}

function addComponentEntry(state: any, moduleId: string, map: Map<string, UsageEntry>, componentId: string, detail?: string) {
  const name = getComponentName(state, componentId, moduleId);
  if (name) addEntry(map, 'component', componentId, name, detail);
  else addEntry(map, 'unknown', componentId, 'Unknown component', detail);
}

function addQueryEntry(
  state: any,
  moduleId: string,
  map: Map<string, UsageEntry>,
  queryId: string,
  detail?: string,
  fallbackName?: string
) {
  const name = getQueryName(state, queryId, moduleId) ?? fallbackName;
  if (name) addEntry(map, 'query', queryId, name, detail);
  else addEntry(map, 'unknown', queryId, 'Unknown query', detail);
}

// Graph source-node paths: components.<id>.<exposed>, queries.<id>.<key>,
// variables.<name>, page.variables.<name>, globals.<...>, constants.<...>
function addSourceNodeEntry(state: any, moduleId: string, map: Map<string, UsageEntry>, path: string, detail?: string) {
  const parts = path.split('.');
  switch (parts[0]) {
    case 'components':
      addComponentEntry(state, moduleId, map, parts[1], detail);
      break;
    case 'queries':
      addQueryEntry(state, moduleId, map, parts[1], detail);
      break;
    case 'variables':
      addEntry(map, 'variable', null, parts.slice(1).join('.'), detail);
      break;
    case 'page':
      if (parts[1] === 'variables') addEntry(map, 'pageVariable', null, parts.slice(2).join('.'), detail);
      break;
    case 'globals':
      addEntry(map, 'global', null, parts.slice(1).join('.'), detail);
      break;
    case 'constants':
      addEntry(map, 'constant', null, parts.slice(1).join('.'), detail);
      break;
    default:
      break; // input/secrets/others — not surfaced in v1
  }
}

// Refs extracted by ast.js: { entityType, entityNameOrId, entityKey }
function addRefEntry(state: any, moduleId: string, map: Map<string, UsageEntry>, ref: any) {
  const { entityType, entityNameOrId, entityKey } = ref;
  switch (entityType) {
    case 'components':
      addComponentEntry(state, moduleId, map, entityNameOrId, entityKey);
      break;
    case 'queries':
      addQueryEntry(state, moduleId, map, entityNameOrId, entityKey);
      break;
    case 'variables':
      addEntry(map, 'variable', null, entityKey);
      break;
    case 'page':
      if (entityNameOrId === 'variables') addEntry(map, 'pageVariable', null, entityKey);
      break;
    case 'globals':
      addEntry(map, 'global', null, entityNameOrId ? `${entityNameOrId}.${entityKey}` : entityKey);
      break;
    case 'constants':
      addEntry(map, 'constant', null, entityNameOrId ? `${entityNameOrId}.${entityKey}` : entityKey);
      break;
    default:
      break;
  }
}

type EventTarget = { kind: UsageEntryKind; id: string | null; name: string };

// Resolves any event handler action to the entity it affects — or a plain
// 'action' entry (show-alert, logout, …) so trigger lists are a complete
// inventory of a source's event handlers.
function resolveEventTarget(state: any, action: any, moduleId: string): EventTarget {
  const actionId = action?.actionId;

  if (QUERY_EVENT_ACTIONS.has(actionId) && action.queryId) {
    const name = getQueryName(state, action.queryId, moduleId) ?? action.queryName;
    return name
      ? { kind: 'query', id: action.queryId, name }
      : { kind: 'unknown', id: action.queryId, name: 'Unknown query' };
  }

  const extractComponent = COMPONENT_EVENT_TARGETS[actionId];
  if (extractComponent) {
    const targetId = extractComponent(action);
    if (targetId && typeof targetId === 'string') {
      const name = getComponentName(state, targetId, moduleId);
      return name
        ? { kind: 'component', id: targetId, name }
        : { kind: 'unknown', id: targetId, name: 'Unknown component' };
    }
    return { kind: 'action', id: null, name: actionId };
  }

  const variableKind = VARIABLE_EVENT_TARGETS[actionId];
  if (variableKind) {
    const key = action.key;
    if (typeof key === 'string' && key.length && !key.includes('{{')) {
      return { kind: variableKind, id: null, name: key };
    }
    return { kind: 'unknown', id: null, name: 'dynamic variable key' };
  }

  if (actionId === 'switch-page') {
    const pages = state.modules?.[moduleId]?.pages ?? [];
    const page =
      pages.find((p: any) => p.id === action.pageId) ??
      pages.find((p: any) => p.handle === action.pageHandle?.toLowerCase?.());
    return page
      ? { kind: 'page', id: page.id, name: page.name }
      : { kind: 'unknown', id: action.pageId ?? null, name: 'Unknown page' };
  }

  return { kind: 'action', id: null, name: actionId ?? 'unknown action' };
}

function eventDetail(action: any, target: EventTarget): string {
  const eventId = action.eventId;
  if (target.kind === 'variable' || target.kind === 'pageVariable') {
    return `${eventId} · ${String(action.actionId).startsWith('unset') ? 'unsets' : 'sets'}`;
  }
  if ((target.kind === 'query' && action.actionId === 'run-query') || target.kind === 'action') return eventId;
  return `${eventId} · ${action.actionId}`;
}

// Memoized per options object — query saves replace options, invalidating the cache entry.
const queryRefsCache = new WeakMap<object, any[]>();

export function getQueryRefs(state: any, query: any, moduleId = 'canvas'): any[] {
  const options = query?.options;
  if (!options || typeof options !== 'object') return [];
  const cached = queryRefsCache.get(options);
  if (cached) return cached;

  const refs: any[] = [];
  try {
    const strings = extractQueryReferences(query.kind, options);
    const componentNameIdMapping = state.modules?.[moduleId]?.componentNameIdMapping ?? {};
    const queryNameIdMapping = state.modules?.[moduleId]?.queryNameIdMapping ?? {};
    strings.forEach((str: string) => {
      try {
        refs.push(...extractAndReplaceReferencesFromString(str, componentNameIdMapping, queryNameIdMapping).allRefs);
      } catch (e) {
        // unparsable expression — skip
      }
    });
  } catch (e) {
    // plugin schema lookup failed — treat as no refs
  }
  queryRefsCache.set(options, refs);
  return refs;
}

const sorted = (map: Map<string, UsageEntry>) =>
  Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));

export function getComponentUsage(state: any, componentId: string, moduleId = 'canvas') {
  const uses = new Map<string, UsageEntry>();
  const usedBy = new Map<string, UsageEntry>();
  const triggers = new Map<string, UsageEntry>();

  const graph = getGraph(state, moduleId);
  const basePath = `components.${componentId}`;

  if (graph) {
    graph.getDirectDependencies(basePath).forEach((node: string) => {
      if (!node.startsWith(`${basePath}.`)) return;
      const parts = node.split('.');
      if (parts.length >= 4 && PARAM_TYPES.has(parts[2])) {
        // Bound property node — its direct dependents are the source entities feeding it
        const property = parts.slice(3).join('.');
        graph.getDirectDependents(node).forEach((source: string) => {
          if (source === basePath || source.startsWith(`${basePath}.`)) return;
          addSourceNodeEntry(state, moduleId, uses, source, property);
        });
      } else if (parts.length === 3) {
        // Exposed value node — its direct dependencies are the consumers
        graph.getDirectDependencies(node).forEach((consumer: string) => {
          const cParts = consumer.split('.');
          if (cParts[0] === 'components' && cParts.length >= 4 && cParts[1] !== componentId) {
            addComponentEntry(state, moduleId, usedBy, cParts[1], cParts.slice(3).join('.'));
          }
          // queries.<id>.__options__ consumers are covered by the query-refs scan below
        });
      }
    });
  }

  // Queries whose options reference this component (works regardless of runOnDependencyChange),
  // plus RunJS bodies / JS transformations that reference it by name (no {{}} — invisible
  // to the reactive engine).
  const componentName = getComponentName(state, componentId, moduleId);
  getQueries(state, moduleId).forEach((query: any) => {
    getQueryRefs(state, query, moduleId).forEach((ref: any) => {
      if (ref.entityType === 'components' && ref.entityNameOrId === componentId) {
        addQueryEntry(state, moduleId, usedBy, query.id, ref.entityKey, query.name);
      }
    });
    if (componentName) {
      const { script, transformation } = getQueryCodeAnalyses(query);
      if (script?.componentRefs.includes(componentName)) {
        addQueryEntry(state, moduleId, usedBy, query.id, 'code', query.name);
      }
      if (transformation?.componentRefs.includes(componentName)) {
        addQueryEntry(state, moduleId, usedBy, query.id, 'transformation', query.name);
      }
    }
  });

  // Event handlers: the component's full trigger inventory (every action it fires),
  // and events on other entities (components, queries, pages) that control this component.
  getEvents(state, moduleId).forEach((evt: any) => {
    const action = evt?.event;
    if (!action) return;

    if (evt?.sourceId === componentId) {
      const target = resolveEventTarget(state, action, moduleId);
      if (target.kind === 'component' && target.id === componentId) return; // self-targeting CSA — skip
      addEntry(triggers, target.kind, target.id, target.name, eventDetail(action, target));
      return;
    }

    const extractTarget = COMPONENT_EVENT_TARGETS[action.actionId];
    if (extractTarget && extractTarget(action) === componentId) {
      const sourceId = evt?.sourceId;
      if (!sourceId) return;
      const detail = `${action.eventId} · ${action.actionId}`;
      if (getComponentName(state, sourceId, moduleId)) {
        addComponentEntry(state, moduleId, usedBy, sourceId, detail);
      } else if (getQueryName(state, sourceId, moduleId)) {
        addQueryEntry(state, moduleId, usedBy, sourceId, detail);
      } else {
        const page = state.modules?.[moduleId]?.pages?.find((p: any) => p.id === sourceId);
        if (page) addEntry(usedBy, 'page', sourceId, page.name, detail);
      }
    }
  });

  return { uses: sorted(uses), usedBy: sorted(usedBy), triggers: sorted(triggers) };
}

export function getQueryUsage(state: any, queryId: string, moduleId = 'canvas') {
  const uses = new Map<string, UsageEntry>();
  const usedBy = new Map<string, UsageEntry>();
  const triggeredBy = new Map<string, UsageEntry>();

  const graph = getGraph(state, moduleId);
  const basePath = `queries.${queryId}`;

  if (graph) {
    graph.getDirectDependencies(basePath).forEach((node: string) => {
      if (!node.startsWith(`${basePath}.`)) return;
      const parts = node.split('.');
      if (parts.length !== 3 || parts[2] === '__options__') return;
      // Exposed key node (data, isLoading, ...) — its direct dependencies are the consumers
      graph.getDirectDependencies(node).forEach((consumer: string) => {
        const cParts = consumer.split('.');
        if (cParts[0] === 'components' && cParts.length >= 4) {
          addComponentEntry(state, moduleId, usedBy, cParts[1], cParts.slice(3).join('.'));
        }
        // query consumers are covered by the query-refs scan below
      });
    });
  }

  const queries = getQueries(state, moduleId);

  // What this query references in its own options — {{}} refs plus, for RunJS /
  // JS transformations, plain-JS refs extracted from the code body.
  const self = queries.find((q: any) => q.id === queryId);
  if (self) {
    getQueryRefs(state, self, moduleId).forEach((ref: any) => addRefEntry(state, moduleId, uses, ref));

    const componentNameIdMapping = state.modules?.[moduleId]?.componentNameIdMapping ?? {};
    const queryNameIdMapping = state.modules?.[moduleId]?.queryNameIdMapping ?? {};
    const { script, transformation } = getQueryCodeAnalyses(self);
    [
      { analysis: script, detail: 'code' },
      { analysis: transformation, detail: 'transformation' },
    ].forEach(({ analysis, detail }) => {
      if (!analysis) return;
      analysis.componentRefs.forEach((name) => {
        const cid = componentNameIdMapping[name];
        if (cid) addComponentEntry(state, moduleId, uses, cid, detail);
        else addEntry(uses, 'unknown', null, name, detail);
      });
      analysis.queryRefs.forEach((name) => {
        const qid = queryNameIdMapping[name];
        if (qid && qid !== queryId) addQueryEntry(state, moduleId, uses, qid, detail);
        else if (!qid) addEntry(uses, 'unknown', null, name, detail);
      });
    });
  }

  // Other queries whose options reference this query — {{}} refs plus RunJS /
  // transformation code refs (queries.<name>.run(), actions.runQuery('<name>')).
  const selfName = getQueryName(state, queryId, moduleId) ?? self?.name;
  queries.forEach((query: any) => {
    if (query.id === queryId) return;
    getQueryRefs(state, query, moduleId).forEach((ref: any) => {
      if (ref.entityType === 'queries' && ref.entityNameOrId === queryId) {
        addQueryEntry(state, moduleId, usedBy, query.id, ref.entityKey, query.name);
      }
    });
    if (selfName) {
      const { script, transformation } = getQueryCodeAnalyses(query);
      if (script?.queryRefs.includes(selfName)) {
        addQueryEntry(state, moduleId, usedBy, query.id, 'code', query.name);
      }
      if (transformation?.queryRefs.includes(selfName)) {
        addQueryEntry(state, moduleId, usedBy, query.id, 'transformation', query.name);
      }
    }
  });

  // Events that run/reset/abort this query — sources are components, other queries, or pages
  getEvents(state, moduleId).forEach((evt: any) => {
    const action = evt?.event;
    if (!action || !QUERY_EVENT_ACTIONS.has(action.actionId) || action.queryId !== queryId) return;
    const sourceId = evt.sourceId;
    if (getComponentName(state, sourceId, moduleId)) {
      addComponentEntry(state, moduleId, triggeredBy, sourceId, action.eventId);
    } else if (getQueryName(state, sourceId, moduleId)) {
      addQueryEntry(state, moduleId, triggeredBy, sourceId, action.eventId);
    } else {
      const page = state.modules?.[moduleId]?.pages?.find((p: any) => p.id === sourceId);
      if (page) addEntry(triggeredBy, 'page', sourceId, page.name, action.eventId);
      else addEntry(triggeredBy, 'unknown', sourceId, 'Unknown source', action.eventId);
    }
  });

  return { uses: sorted(uses), usedBy: sorted(usedBy), triggeredBy: sorted(triggeredBy) };
}

export function getQueryUsageCount(state: any, queryId: string, moduleId = 'canvas'): number {
  const { usedBy, triggeredBy } = getQueryUsage(state, queryId, moduleId);
  return usedBy.length + triggeredBy.length;
}

/**
 * The query's own success/failure event handlers, in execution order
 * (sorted by event index — sequence matters, so no dedupe and no name sort).
 */
export function getQueryOwnEvents(state: any, queryId: string, moduleId = 'canvas') {
  const onSuccess: UsageEntry[] = [];
  const onFailure: UsageEntry[] = [];

  getEvents(state, moduleId)
    .filter((evt: any) => evt?.sourceId === queryId && evt?.event)
    .slice()
    .sort((a: any, b: any) => (a.index ?? 0) - (b.index ?? 0))
    .forEach((evt: any) => {
      const action = evt.event;
      const target = resolveEventTarget(state, action, moduleId);
      const entry: UsageEntry = {
        kind: target.kind,
        id: target.id,
        name: target.name,
        details: target.kind === 'action' ? [] : [action.actionId],
      };
      if (action.eventId === 'onDataQuerySuccess') onSuccess.push(entry);
      else if (action.eventId === 'onDataQueryFailure') onFailure.push(entry);
    });

  return { onSuccess, onFailure };
}

/**
 * Queries that run automatically on load, split by lifecycle (see useAppData.js):
 * - appLoad: per-query "Run this query on application load" option (internally
 *   `runOnPageLoad`) — runs ONCE when the app loads, explicitly skipped on page switches.
 * - pageLoad: run-query actions on the current page's onPageLoad events
 *   (`target === 'page' && sourceId === currentPageId`) — run on app load AND on
 *   every navigation to the page.
 */
export function getPageLoadQueries(state: any, moduleId = 'canvas') {
  const appLoad = new Map<string, UsageEntry>();
  const pageLoad = new Map<string, UsageEntry>();

  getQueries(state, moduleId).forEach((query: any) => {
    if (query.options?.runOnPageLoad || query.options?.run_on_page_load) {
      addEntry(appLoad, 'query', query.id, query.name, 'once, when the app loads');
    }
  });

  const pageLoadActions: UsageEntry[] = [];
  const currentPageId = state.getCurrentPageId?.(moduleId);
  getEvents(state, moduleId).forEach((evt: any) => {
    const action = evt?.event;
    if (!action || action.eventId !== 'onPageLoad') return;
    // Same filter the runtime uses when firing page events (useAppData.js)
    if (evt?.target !== 'page' || evt?.sourceId !== currentPageId) return;

    if (QUERY_EVENT_ACTIONS.has(action.actionId) && action.queryId) {
      const name = getQueryName(state, action.queryId, moduleId) ?? action.queryName;
      if (name) addEntry(pageLoad, 'query', action.queryId, name, 'every visit to this page');
      else addEntry(pageLoad, 'unknown', action.queryId, 'Unknown query', 'every visit to this page');
      return;
    }

    // Non-query page-load activity: show-modal, set variable, etc.
    const target = resolveEventTarget(state, action, moduleId);
    pageLoadActions.push({
      kind: target.kind,
      id: target.id,
      name: target.name,
      details: target.kind === 'action' ? [] : [action.actionId],
    });
  });

  return { appLoad: sorted(appLoad), pageLoad: sorted(pageLoad), pageLoadActions };
}

export type GraphNode = { id: string; kind: UsageEntryKind; name: string; entityId: string | null };
export type GraphEdge = { id: string; source: string; target: string; kind: 'binds' | 'triggers' };

/**
 * Whole-page dependency graph for the visual graph view.
 * Nodes: all page components, all queries (orphans included — hygiene visibility),
 * plus every variable/global/constant that appears in a binding.
 * Edges point in data-flow direction (source entity feeds consumer); event links
 * (component → query it runs) are kind 'triggers'.
 */
export function getPageDependencyGraph(state: any, moduleId = 'canvas') {
  const nodes = new Map<string, GraphNode>();
  const edges = new Map<string, GraphEdge>();

  const addNode = (kind: UsageEntryKind, entityId: string | null, name: string) => {
    const key = `${kind}:${entityId ?? name}`;
    if (!nodes.has(key)) nodes.set(key, { id: key, kind, name, entityId });
    return key;
  };

  const addEdge = (source: string, target: string, kind: 'binds' | 'triggers') => {
    const id = `${source}->${target}:${kind}`;
    if (!edges.has(id)) edges.set(id, { id, source, target, kind });
  };

  const pageComponents = state.getCurrentPageComponents?.(moduleId) ?? {};
  Object.entries(pageComponents).forEach(([componentId, definition]: [string, any]) => {
    const componentKey = addNode('component', componentId, definition?.component?.name ?? componentId);
    const usage = getComponentUsage(state, componentId, moduleId);
    usage.uses.forEach((entry) => addEdge(addNode(entry.kind, entry.id, entry.name), componentKey, 'binds'));
    usage.usedBy.forEach((entry) => addEdge(componentKey, addNode(entry.kind, entry.id, entry.name), 'binds'));
    usage.triggers.forEach((entry) => {
      if (entry.kind === 'action') return; // show-alert/logout/etc. are not entities — noise as graph nodes
      addEdge(componentKey, addNode(entry.kind, entry.id, entry.name), 'triggers');
    });
  });

  // Every page query gets a node even when unconnected, so dead queries are visible.
  getQueries(state, moduleId).forEach((query: any) => addNode('query', query.id, query.name));

  return { nodes: Array.from(nodes.values()), edges: Array.from(edges.values()) };
}

export type CustomCodeScript = { id: string; name: string; kind: 'runjs' | 'runpy'; analysis: ScriptAnalysis | null };
export type CustomCodeTransformation = { queryId: string; name: string; language: string; analysis: ScriptAnalysis | null };
export type FxComponent = {
  componentId: string;
  name: string;
  entries: { section: string; prop: string; expression: string }[];
};

/**
 * Everywhere custom code lives on the current page:
 * - scripts: RunJS/RunPy queries (RunPy is listed but never parsed)
 * - transformations: queries with enableTransformation (analysis for JS only)
 * - fxByComponent: component properties/styles switched to fx mode
 */
export function getCustomCodeInventory(state: any, moduleId = 'canvas') {
  const scripts: CustomCodeScript[] = [];
  const transformations: CustomCodeTransformation[] = [];

  getQueries(state, moduleId).forEach((query: any) => {
    const { script, transformation } = getQueryCodeAnalyses(query);
    if (query.kind === 'runjs' || query.kind === 'runpy') {
      scripts.push({ id: query.id, name: query.name, kind: query.kind, analysis: script });
    }
    if (query.options?.enableTransformation) {
      transformations.push({
        queryId: query.id,
        name: query.name,
        language: query.options.transformationLanguage ?? 'javascript',
        analysis: transformation,
      });
    }
  });

  const fxByComponent: FxComponent[] = [];
  const pageComponents = state.getCurrentPageComponents?.(moduleId) ?? {};
  Object.entries(pageComponents).forEach(([componentId, definition]: [string, any]) => {
    const sections = definition?.component?.definition ?? {};
    const entries: FxComponent['entries'] = [];
    PARAM_TYPES.forEach((section) => {
      const params = sections[section];
      if (!params || typeof params !== 'object') return;
      Object.entries(params).forEach(([prop, param]: [string, any]) => {
        if (param?.fxActive === true) {
          entries.push({ section, prop, expression: String(param.value ?? '') });
        }
      });
    });
    if (entries.length) {
      fxByComponent.push({ componentId, name: definition?.component?.name ?? componentId, entries });
    }
  });

  scripts.sort((a, b) => a.name.localeCompare(b.name));
  transformations.sort((a, b) => a.name.localeCompare(b.name));
  fxByComponent.sort((a, b) => a.name.localeCompare(b.name));
  return { scripts, transformations, fxByComponent };
}

export type VariableUsage = {
  name: string;
  scope: 'app' | 'page';
  setBy: UsageEntry[];
  readBy: UsageEntry[];
};

/**
 * Variable-centric view: who sets / reads each app and page variable.
 * Sources: script analyses (RunJS + JS transformations), {{}} refs in query
 * options, component bindings (via getComponentUsage), and event-handler
 * variable writes. Runtime-only variables (set but never referenced
 * statically) are included via exposedValues keys.
 * Current values are NOT returned — the UI reads them live via selectors.
 */
export function getVariableUsage(state: any, moduleId = 'canvas') {
  type Row = { name: string; scope: 'app' | 'page'; setBy: Map<string, UsageEntry>; readBy: Map<string, UsageEntry> };
  const rows = new Map<string, Row>();
  const dynamicAccessors = new Map<string, UsageEntry>();

  const row = (scope: 'app' | 'page', name: string): Row => {
    const key = `${scope}:${name}`;
    let r = rows.get(key);
    if (!r) {
      r = { name, scope, setBy: new Map(), readBy: new Map() };
      rows.set(key, r);
    }
    return r;
  };

  const applyAnalysis = (analysis: ScriptAnalysis | null, queryId: string, queryName: string, detail: string) => {
    if (!analysis) return;
    analysis.variableWrites.forEach((n) => addQueryEntry(state, moduleId, row('app', n).setBy, queryId, detail, queryName));
    analysis.variableReads.forEach((n) => addQueryEntry(state, moduleId, row('app', n).readBy, queryId, detail, queryName));
    analysis.pageVariableWrites.forEach((n) =>
      addQueryEntry(state, moduleId, row('page', n).setBy, queryId, detail, queryName)
    );
    analysis.pageVariableReads.forEach((n) =>
      addQueryEntry(state, moduleId, row('page', n).readBy, queryId, detail, queryName)
    );
    if (analysis.dynamicVariableOps) {
      addQueryEntry(state, moduleId, dynamicAccessors, queryId, detail, queryName);
    }
  };

  // 1. Scripts and transformations
  getQueries(state, moduleId).forEach((query: any) => {
    const { script, transformation } = getQueryCodeAnalyses(query);
    applyAnalysis(script, query.id, query.name, 'code');
    applyAnalysis(transformation, query.id, query.name, 'transformation');

    // 2. {{}} refs in query options read variables
    getQueryRefs(state, query, moduleId).forEach((ref: any) => {
      if (ref.entityType === 'variables') addQueryEntry(state, moduleId, row('app', ref.entityKey).readBy, query.id, undefined, query.name);
      else if (ref.entityType === 'page' && ref.entityNameOrId === 'variables')
        addQueryEntry(state, moduleId, row('page', ref.entityKey).readBy, query.id, undefined, query.name);
    });
  });

  // 3. Component bindings that read variables
  const pageComponents = state.getCurrentPageComponents?.(moduleId) ?? {};
  Object.keys(pageComponents).forEach((componentId) => {
    const usage = getComponentUsage(state, componentId, moduleId);
    usage.uses.forEach((entry) => {
      if (entry.kind === 'variable') {
        addComponentEntry(state, moduleId, row('app', entry.name).readBy, componentId, entry.details[0]);
      } else if (entry.kind === 'pageVariable') {
        addComponentEntry(state, moduleId, row('page', entry.name).readBy, componentId, entry.details[0]);
      }
    });
  });

  // 4. Event-handler variable actions (writers only — variable READS by scripts are
  // captured via script analysis; there is no persisted "get variable" event action)
  getEvents(state, moduleId).forEach((evt: any) => {
    const action = evt?.event;
    if (!action) return;
    const writeKind = VARIABLE_EVENT_TARGETS[action.actionId];
    if (!writeKind) return;
    const key = action.key;
    if (typeof key !== 'string' || !key.length || key.includes('{{')) return; // dynamic key
    const scope: 'app' | 'page' = writeKind === 'variable' ? 'app' : 'page';
    const bucket = row(scope, key).setBy;
    const sourceId = evt?.sourceId;
    const detail = action.eventId;
    if (getComponentName(state, sourceId, moduleId)) addComponentEntry(state, moduleId, bucket, sourceId, detail);
    else if (getQueryName(state, sourceId, moduleId)) addQueryEntry(state, moduleId, bucket, sourceId, detail);
    else {
      const page = state.modules?.[moduleId]?.pages?.find((p: any) => p.id === sourceId);
      if (page) addEntry(bucket, 'page', sourceId, page.name, detail);
    }
  });

  // 5. Runtime-only variables (exist in exposedValues but never referenced statically)
  const exposed = state.resolvedStore?.modules?.[moduleId]?.exposedValues;
  Object.keys(exposed?.variables ?? {}).forEach((n) => row('app', n));
  Object.keys(exposed?.page?.variables ?? {}).forEach((n) => row('page', n));

  const variables: VariableUsage[] = Array.from(rows.values())
    .map((r) => ({ name: r.name, scope: r.scope, setBy: sorted(r.setBy), readBy: sorted(r.readBy) }))
    .sort((a, b) => a.scope.localeCompare(b.scope) || a.name.localeCompare(b.name));

  return { variables, dynamicAccessors: sorted(dynamicAccessors) };
}
