import { extractQueryReferences } from '@/AppBuilder/_utils/queryPanel';
import { extractAndReplaceReferencesFromString } from '@/AppBuilder/_stores/ast';

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

  // Queries whose options reference this component (works regardless of runOnDependencyChange)
  getQueries(state, moduleId).forEach((query: any) => {
    getQueryRefs(state, query, moduleId).forEach((ref: any) => {
      if (ref.entityType === 'components' && ref.entityNameOrId === componentId) {
        addQueryEntry(state, moduleId, usedBy, query.id, ref.entityKey, query.name);
      }
    });
  });

  // Event handlers: queries this component runs, components it controls,
  // and events on other entities that control this component.
  getEvents(state, moduleId).forEach((evt: any) => {
    const action = evt?.event;
    if (!action) return;
    const extractTarget = COMPONENT_EVENT_TARGETS[action.actionId];

    if (evt?.sourceId === componentId) {
      if (QUERY_EVENT_ACTIONS.has(action.actionId) && action.queryId) {
        addQueryEntry(state, moduleId, triggers, action.queryId, action.eventId, action.queryName);
      } else if (extractTarget) {
        const targetId = extractTarget(action);
        if (targetId && typeof targetId === 'string' && targetId !== componentId) {
          addComponentEntry(state, moduleId, triggers, targetId, `${action.eventId} · ${action.actionId}`);
        }
      }
    } else if (extractTarget && extractTarget(action) === componentId) {
      const sourceId = evt?.sourceId;
      if (!sourceId) return;
      if (getComponentName(state, sourceId, moduleId)) {
        addComponentEntry(state, moduleId, usedBy, sourceId, `${action.eventId} · ${action.actionId}`);
      } else if (getQueryName(state, sourceId, moduleId)) {
        addQueryEntry(state, moduleId, usedBy, sourceId, `${action.eventId} · ${action.actionId}`);
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

  // What this query references in its own options
  const self = queries.find((q: any) => q.id === queryId);
  if (self) {
    getQueryRefs(state, self, moduleId).forEach((ref: any) => addRefEntry(state, moduleId, uses, ref));
  }

  // Other queries whose options reference this query
  queries.forEach((query: any) => {
    if (query.id === queryId) return;
    getQueryRefs(state, query, moduleId).forEach((ref: any) => {
      if (ref.entityType === 'queries' && ref.entityNameOrId === queryId) {
        addQueryEntry(state, moduleId, usedBy, query.id, ref.entityKey, query.name);
      }
    });
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

  const currentPageId = state.getCurrentPageId?.(moduleId);
  getEvents(state, moduleId).forEach((evt: any) => {
    const action = evt?.event;
    if (!action || action.eventId !== 'onPageLoad' || !QUERY_EVENT_ACTIONS.has(action.actionId) || !action.queryId)
      return;
    // Same filter the runtime uses when firing page events (useAppData.js)
    if (evt?.target !== 'page' || evt?.sourceId !== currentPageId) return;
    const name = getQueryName(state, action.queryId, moduleId) ?? action.queryName;
    if (name) addEntry(pageLoad, 'query', action.queryId, name, 'every visit to this page');
    else addEntry(pageLoad, 'unknown', action.queryId, 'Unknown query', 'every visit to this page');
  });

  return { appLoad: sorted(appLoad), pageLoad: sorted(pageLoad) };
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
    usage.triggers.forEach((entry) => addEdge(componentKey, addNode(entry.kind, entry.id, entry.name), 'triggers'));
  });

  // Every page query gets a node even when unconnected, so dead queries are visible.
  getQueries(state, moduleId).forEach((query: any) => addNode('query', query.id, query.name));

  return { nodes: Array.from(nodes.values()), edges: Array.from(edges.values()) };
}
