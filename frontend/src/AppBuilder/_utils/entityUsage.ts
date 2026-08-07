import { extractQueryReferences } from '@/AppBuilder/_utils/queryPanel';
import { extractAndReplaceReferencesFromString } from '@/AppBuilder/_stores/ast';
import { getQueryCodeAnalyses, ScriptAnalysis } from '@/AppBuilder/_utils/scriptAnalysis';
import { getAllChildComponents } from '@/AppBuilder/AppCanvas/appCanvasUtils';

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

/**
 * One reason an entry is related to the subject.
 * - label: the raw key (a bound property, or `${eventId} · ${actionId}`)
 * - expression: the literal binding text behind that key, when resolvable
 * - eventId/actionId: set for event-handler details so the UI can render
 *   "On click → Run query" instead of the raw ids
 */
export type UsageDetail = {
  label: string;
  expression?: string;
  eventId?: string;
  actionId?: string;
};

export type UsageEntry = {
  kind: UsageEntryKind;
  id: string | null;
  name: string;
  details: UsageDetail[];
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

// `label` alone identifies a detail; a later occurrence only fills in a missing expression.
export const detailOf = (label?: string, expression?: string): UsageDetail | undefined =>
  label ? { label, ...(expression ? { expression } : {}) } : undefined;

/**
 * The literal text bound to `components.<id>.<section>.<prop>` — the expression the
 * dependency graph node was built from. Returns undefined for non-string values.
 */
function componentBindingExpression(state: any, moduleId: string, componentId: string, section: string, prop: string) {
  const value = state.getComponentDefinition?.(componentId, moduleId)?.component?.definition?.[section]?.[prop]?.value;
  return typeof value === 'string' && value.length ? value : undefined;
}

function addEntry(
  map: Map<string, UsageEntry>,
  kind: UsageEntryKind,
  id: string | null,
  name: string,
  detail?: UsageDetail
) {
  const key = `${kind}:${id ?? name}`;
  let entry = map.get(key);
  if (!entry) {
    entry = { kind, id, name, details: [] };
    map.set(key, entry);
  }
  if (!detail?.label) return;
  const existing = entry.details.find((d) => d.label === detail.label);
  if (!existing) entry.details.push(detail);
  else if (!existing.expression && detail.expression) existing.expression = detail.expression;
}

function addComponentEntry(
  state: any,
  moduleId: string,
  map: Map<string, UsageEntry>,
  componentId: string,
  detail?: UsageDetail
) {
  const name = getComponentName(state, componentId, moduleId);
  if (name) addEntry(map, 'component', componentId, name, detail);
  else addEntry(map, 'unknown', componentId, 'Unknown component', detail);
}

function addQueryEntry(
  state: any,
  moduleId: string,
  map: Map<string, UsageEntry>,
  queryId: string,
  detail?: UsageDetail,
  fallbackName?: string
) {
  const name = getQueryName(state, queryId, moduleId) ?? fallbackName;
  if (name) addEntry(map, 'query', queryId, name, detail);
  else addEntry(map, 'unknown', queryId, 'Unknown query', detail);
}

// Graph source-node paths: components.<id>.<exposed>, queries.<id>.<key>,
// variables.<name>, page.variables.<name>, globals.<...>, constants.<...>
function addSourceNodeEntry(
  state: any,
  moduleId: string,
  map: Map<string, UsageEntry>,
  path: string,
  detail?: UsageDetail
) {
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

// Refs extracted by ast.js: { entityType, entityNameOrId, entityKey }, with the
// originating option string attached by getQueryRefs as `sourceString`.
function addRefEntry(state: any, moduleId: string, map: Map<string, UsageEntry>, ref: any) {
  const { entityType, entityNameOrId, entityKey, sourceString } = ref;
  const detail = detailOf(entityKey, sourceString);
  switch (entityType) {
    case 'components':
      addComponentEntry(state, moduleId, map, entityNameOrId, detail);
      break;
    case 'queries':
      addQueryEntry(state, moduleId, map, entityNameOrId, detail);
      break;
    case 'variables':
      addEntry(map, 'variable', null, entityKey, detailOf(sourceString && 'value', sourceString));
      break;
    case 'page':
      if (entityNameOrId === 'variables')
        addEntry(map, 'pageVariable', null, entityKey, detailOf(sourceString && 'value', sourceString));
      break;
    case 'globals':
      addEntry(
        map,
        'global',
        null,
        entityNameOrId ? `${entityNameOrId}.${entityKey}` : entityKey,
        detailOf(sourceString && 'value', sourceString)
      );
      break;
    case 'constants':
      addEntry(
        map,
        'constant',
        null,
        entityNameOrId ? `${entityNameOrId}.${entityKey}` : entityKey,
        detailOf(sourceString && 'value', sourceString)
      );
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

function eventDetail(action: any, target: EventTarget): UsageDetail {
  const eventId = action.eventId;
  const actionId = String(action.actionId);
  if (target.kind === 'variable' || target.kind === 'pageVariable') {
    return { label: `${eventId} · ${actionId}`, eventId, actionId };
  }
  if ((target.kind === 'query' && actionId === 'run-query') || target.kind === 'action') {
    return { label: eventId, eventId, actionId };
  }
  return { label: `${eventId} · ${actionId}`, eventId, actionId };
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
        const { allRefs } = extractAndReplaceReferencesFromString(str, componentNameIdMapping, queryNameIdMapping);
        // Keep the option text each ref came from — it is the expression shown on hover.
        allRefs.forEach((ref: any) => refs.push({ ...ref, sourceString: str }));
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
        const expression = componentBindingExpression(state, moduleId, componentId, parts[2], property);
        graph.getDirectDependents(node).forEach((source: string) => {
          if (source === basePath || source.startsWith(`${basePath}.`)) return;
          addSourceNodeEntry(state, moduleId, uses, source, detailOf(property, expression));
        });
      } else if (parts.length === 3) {
        // Exposed value node — its direct dependencies are the consumers
        graph.getDirectDependencies(node).forEach((consumer: string) => {
          const cParts = consumer.split('.');
          if (cParts[0] === 'components' && cParts.length >= 4 && cParts[1] !== componentId) {
            const consumerProperty = cParts.slice(3).join('.');
            addComponentEntry(
              state,
              moduleId,
              usedBy,
              cParts[1],
              detailOf(
                consumerProperty,
                componentBindingExpression(state, moduleId, cParts[1], cParts[2], consumerProperty)
              )
            );
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
        addQueryEntry(state, moduleId, usedBy, query.id, detailOf(ref.entityKey, ref.sourceString), query.name);
      }
    });
    if (componentName) {
      const { script, transformation } = getQueryCodeAnalyses(query);
      if (script?.componentRefs.includes(componentName)) {
        addQueryEntry(state, moduleId, usedBy, query.id, detailOf('code'), query.name);
      }
      if (transformation?.componentRefs.includes(componentName)) {
        addQueryEntry(state, moduleId, usedBy, query.id, detailOf('transformation'), query.name);
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
      const detail: UsageDetail = {
        label: `${action.eventId} · ${action.actionId}`,
        eventId: action.eventId,
        actionId: action.actionId,
      };
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
          const consumerProperty = cParts.slice(3).join('.');
          addComponentEntry(
            state,
            moduleId,
            usedBy,
            cParts[1],
            detailOf(
              consumerProperty,
              componentBindingExpression(state, moduleId, cParts[1], cParts[2], consumerProperty)
            )
          );
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
        if (cid) addComponentEntry(state, moduleId, uses, cid, detailOf(detail));
        else addEntry(uses, 'unknown', null, name, detailOf(detail));
      });
      analysis.queryRefs.forEach((name) => {
        const qid = queryNameIdMapping[name];
        if (qid && qid !== queryId) addQueryEntry(state, moduleId, uses, qid, detailOf(detail));
        else if (!qid) addEntry(uses, 'unknown', null, name, detailOf(detail));
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
        addQueryEntry(state, moduleId, usedBy, query.id, detailOf(ref.entityKey, ref.sourceString), query.name);
      }
    });
    if (selfName) {
      const { script, transformation } = getQueryCodeAnalyses(query);
      if (script?.queryRefs.includes(selfName)) {
        addQueryEntry(state, moduleId, usedBy, query.id, detailOf('code'), query.name);
      }
      if (transformation?.queryRefs.includes(selfName)) {
        addQueryEntry(state, moduleId, usedBy, query.id, detailOf('transformation'), query.name);
      }
    }
  });

  // Events that run/reset/abort this query — sources are components, other queries, or pages
  getEvents(state, moduleId).forEach((evt: any) => {
    const action = evt?.event;
    if (!action || !QUERY_EVENT_ACTIONS.has(action.actionId) || action.queryId !== queryId) return;
    const sourceId = evt.sourceId;
    const detail: UsageDetail = { label: action.eventId, eventId: action.eventId, actionId: action.actionId };
    if (getComponentName(state, sourceId, moduleId)) {
      addComponentEntry(state, moduleId, triggeredBy, sourceId, detail);
    } else if (getQueryName(state, sourceId, moduleId)) {
      addQueryEntry(state, moduleId, triggeredBy, sourceId, detail);
    } else {
      const page = state.modules?.[moduleId]?.pages?.find((p: any) => p.id === sourceId);
      if (page) addEntry(triggeredBy, 'page', sourceId, page.name, detail);
      else addEntry(triggeredBy, 'unknown', sourceId, 'Unknown source', detail);
    }
  });

  return { uses: sorted(uses), usedBy: sorted(usedBy), triggeredBy: sorted(triggeredBy) };
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
        details: [{ label: action.actionId, eventId: action.eventId, actionId: action.actionId }],
      };
      if (action.eventId === 'onDataQuerySuccess') onSuccess.push(entry);
      else if (action.eventId === 'onDataQueryFailure') onFailure.push(entry);
    });

  return { onSuccess, onFailure };
}

export type RunsOnLoadSections = {
  appLoad: UsageEntry[];
  pageLoad: UsageEntry[];
  pageLoadActions: UsageEntry[];
};

/**
 * Queries that run automatically on load, split by lifecycle (see useAppData.js):
 * - appLoad: per-query "Run this query on application load" option (internally
 *   `runOnPageLoad`) — runs ONCE when the app loads, explicitly skipped on page switches.
 * - pageLoad: run-query actions on the current page's onPageLoad events
 *   (`target === 'page' && sourceId === currentPageId`) — run on app load AND on
 *   every navigation to the page.
 */
export function getPageLoadQueries(state: any, moduleId = 'canvas'): RunsOnLoadSections {
  const appLoad = new Map<string, UsageEntry>();
  const pageLoad = new Map<string, UsageEntry>();

  getQueries(state, moduleId).forEach((query: any) => {
    if (query.options?.runOnPageLoad || query.options?.run_on_page_load) {
      addEntry(appLoad, 'query', query.id, query.name, detailOf('once, when the app loads'));
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
      if (name) addEntry(pageLoad, 'query', action.queryId, name, detailOf('every visit to this page'));
      else addEntry(pageLoad, 'unknown', action.queryId, 'Unknown query', detailOf('every visit to this page'));
      return;
    }

    // Non-query page-load activity: show-modal, set variable, etc.
    const target = resolveEventTarget(state, action, moduleId);
    pageLoadActions.push({
      kind: target.kind,
      id: target.id,
      name: target.name,
      details: [{ label: action.actionId, eventId: action.eventId, actionId: action.actionId }],
    });
  });

  return { appLoad: sorted(appLoad), pageLoad: sorted(pageLoad), pageLoadActions };
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

  const row = (scope: 'app' | 'page', name: string): Row => {
    const key = `${scope}:${name}`;
    let r = rows.get(key);
    if (!r) {
      r = { name, scope, setBy: new Map(), readBy: new Map() };
      rows.set(key, r);
    }
    return r;
  };

  const applyAnalysis = (analysis: ScriptAnalysis | null, queryId: string, queryName: string, label: string) => {
    if (!analysis) return;
    const detail = detailOf(label);
    analysis.variableWrites.forEach((n) => addQueryEntry(state, moduleId, row('app', n).setBy, queryId, detail, queryName));
    analysis.variableReads.forEach((n) => addQueryEntry(state, moduleId, row('app', n).readBy, queryId, detail, queryName));
    analysis.pageVariableWrites.forEach((n) =>
      addQueryEntry(state, moduleId, row('page', n).setBy, queryId, detail, queryName)
    );
    analysis.pageVariableReads.forEach((n) =>
      addQueryEntry(state, moduleId, row('page', n).readBy, queryId, detail, queryName)
    );
  };

  // 1. Scripts and transformations
  getQueries(state, moduleId).forEach((query: any) => {
    const { script, transformation } = getQueryCodeAnalyses(query);
    applyAnalysis(script, query.id, query.name, 'code');
    applyAnalysis(transformation, query.id, query.name, 'transformation');

    // 2. {{}} refs in query options read variables
    getQueryRefs(state, query, moduleId).forEach((ref: any) => {
      const refDetail = detailOf(ref.sourceString && 'value', ref.sourceString);
      if (ref.entityType === 'variables')
        addQueryEntry(state, moduleId, row('app', ref.entityKey).readBy, query.id, refDetail, query.name);
      else if (ref.entityType === 'page' && ref.entityNameOrId === 'variables')
        addQueryEntry(state, moduleId, row('page', ref.entityKey).readBy, query.id, refDetail, query.name);
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
    const detail: UsageDetail = { label: action.eventId, eventId: action.eventId, actionId: action.actionId };
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

  return { variables };
}

export type DeleteTargets = { componentIds?: string[]; queryIds?: string[] };

export type DeleteSubject = {
  kind: 'component' | 'query';
  id: string;
  name: string;
  /** Widget type of a component subject — the card header icon is resolved from it. */
  componentType?: string;
  /** The raw query, for the datasource icon on a query subject's card header. */
  query?: any;
  /** References from outside the selection that block the delete. */
  dependents: UsageEntry[];
  /**
   * entryKey -> name of the descendant the reference actually points at, for
   * dependents that reach the subject only through a child (deleting a container
   * deletes its children, so their references block the container too).
   */
  viaDescendant: Record<string, string>;
};

const entryKeyOf = (entry: UsageEntry) => `${entry.kind}:${entry.id ?? entry.name}`;

/** Merges `entry` into `bucket`, unioning details so one dependent is listed once. */
function mergeDependent(bucket: Map<string, UsageEntry>, entry: UsageEntry) {
  const key = entryKeyOf(entry);
  const existing = bucket.get(key);
  if (!existing) {
    bucket.set(key, { ...entry, details: [...entry.details] });
    return;
  }
  entry.details.forEach((detail) => {
    const match = existing.details.find((d) => d.label === detail.label);
    if (!match) existing.details.push(detail);
    else if (!match.expression && detail.expression) match.expression = detail.expression;
  });
}

/**
 * Everything that stops `targets` from being deleted: one entry per target that is
 * still referenced from outside the selection, with the referencing entities.
 *
 * An empty array means the delete is safe to perform. Read-only — like the rest of
 * this module it never writes to the graph or the resolved store.
 *
 * Two kinds of reference are deliberately not blockers:
 *  - references originating inside the selection (they are being deleted too), where
 *    the selection includes every descendant of a selected component
 *  - `unknown` entries, i.e. refs whose target no longer resolves; a stale binding
 *    must never make an entity permanently undeletable
 */
export function getDeleteBlockers(state: any, targets: DeleteTargets, moduleId = 'canvas'): DeleteSubject[] {
  const componentIds = (targets.componentIds ?? []).filter(Boolean);
  const queryIds = (targets.queryIds ?? []).filter(Boolean);
  if (!componentIds.length && !queryIds.length) return [];

  const allComponents = state.getCurrentPageComponents?.(moduleId) ?? {};

  // Descendants are deleted along with their parent, so they are part of the selection
  // for filtering purposes and their references count against the parent.
  const descendantsOf = new Map<string, string[]>();
  const componentClosure = new Set<string>(componentIds);
  componentIds.forEach((componentId) => {
    const childIds = getAllChildComponents(allComponents, componentId).map((child: any) => child.id);
    descendantsOf.set(componentId, childIds);
    childIds.forEach((childId: string) => componentClosure.add(childId));
  });
  const queryClosure = new Set<string>(queryIds);

  const isInsideSelection = (entry: UsageEntry) =>
    (entry.kind === 'component' && entry.id && componentClosure.has(entry.id)) ||
    (entry.kind === 'query' && entry.id && queryClosure.has(entry.id));

  const isBlocking = (entry: UsageEntry) => entry.kind !== 'unknown' && !isInsideSelection(entry);

  const subjects: DeleteSubject[] = [];

  componentIds.forEach((componentId) => {
    const definition = allComponents[componentId];
    const dependents = new Map<string, UsageEntry>();
    const viaDescendant: Record<string, string> = {};
    const fromSubject = new Set<string>();

    getComponentUsage(state, componentId, moduleId).usedBy.filter(isBlocking).forEach((entry) => {
      fromSubject.add(entryKeyOf(entry));
      mergeDependent(dependents, entry);
    });

    (descendantsOf.get(componentId) ?? []).forEach((childId) => {
      const childName = getComponentName(state, childId, moduleId) ?? childId;
      getComponentUsage(state, childId, moduleId).usedBy.filter(isBlocking).forEach((entry) => {
        const key = entryKeyOf(entry);
        mergeDependent(dependents, entry);
        if (!fromSubject.has(key) && !viaDescendant[key]) viaDescendant[key] = childName;
      });
    });

    if (!dependents.size) return;
    subjects.push({
      kind: 'component',
      id: componentId,
      name: definition?.component?.name ?? componentId,
      componentType: definition?.component?.component,
      dependents: Array.from(dependents.values()),
      viaDescendant,
    });
  });

  const queries = getQueries(state, moduleId);
  queryIds.forEach((queryId) => {
    const usage = getQueryUsage(state, queryId, moduleId);
    const dependents = new Map<string, UsageEntry>();
    // A `Run query` event handler breaks just as surely as a {{}} binding does.
    [...usage.usedBy, ...usage.triggeredBy].filter(isBlocking).forEach((entry) => mergeDependent(dependents, entry));

    if (!dependents.size) return;
    const query = queries.find((q: any) => q.id === queryId);
    subjects.push({
      kind: 'query',
      id: queryId,
      name: getQueryName(state, queryId, moduleId) ?? query?.name ?? queryId,
      query,
      dependents: Array.from(dependents.values()),
      viaDescendant: {},
    });
  });

  return subjects.sort((a, b) => a.name.localeCompare(b.name));
}

export type QuerySection = {
  id: string;
  name: string;
  query: any;
  usage: ReturnType<typeof getQueryUsage>;
  ownEvents: ReturnType<typeof getQueryOwnEvents>;
  loadTriggers: { appLoad: boolean; pageLoad: boolean };
};

export type ComponentSection = {
  id: string;
  name: string;
  componentType: string;
  definition: any;
  usage: ReturnType<typeof getComponentUsage>;
};

export type DependencySections = {
  runsOnLoad: RunsOnLoadSections;
  queries: QuerySection[];
  components: ComponentSection[];
  variables: { app: VariableUsage[]; page: VariableUsage[] };
};

/**
 * Everything the Dependencies panel renders, in one traversal.
 *
 * Queries, components and variables are filtered down to those that actually
 * participate in a relationship — an entity nothing references and that
 * references nothing is not a dependency, so it is left out of the lists.
 */
export function getDependencySections(state: any, moduleId = 'canvas'): DependencySections {
  const runsOnLoad = getPageLoadQueries(state, moduleId);
  const appLoadIds = new Set(runsOnLoad.appLoad.map((entry) => entry.id));
  const pageLoadIds = new Set(runsOnLoad.pageLoad.map((entry) => entry.id));

  const queries: QuerySection[] = [];
  getQueries(state, moduleId).forEach((query: any) => {
    const usage = getQueryUsage(state, query.id, moduleId);
    const ownEvents = getQueryOwnEvents(state, query.id, moduleId);
    const loadTriggers = { appLoad: appLoadIds.has(query.id), pageLoad: pageLoadIds.has(query.id) };
    const total =
      usage.uses.length +
      usage.usedBy.length +
      usage.triggeredBy.length +
      ownEvents.onSuccess.length +
      ownEvents.onFailure.length +
      (loadTriggers.appLoad ? 1 : 0) +
      (loadTriggers.pageLoad ? 1 : 0);
    if (total === 0) return;
    queries.push({ id: query.id, name: query.name, query, usage, ownEvents, loadTriggers });
  });
  queries.sort((a, b) => a.name.localeCompare(b.name));

  const components: ComponentSection[] = [];
  const pageComponents = state.getCurrentPageComponents?.(moduleId) ?? {};
  Object.entries(pageComponents).forEach(([id, definition]: [string, any]) => {
    const usage = getComponentUsage(state, id, moduleId);
    if (usage.uses.length + usage.usedBy.length + usage.triggers.length === 0) return;
    components.push({
      id,
      name: definition?.component?.name ?? id,
      componentType: definition?.component?.component ?? '',
      definition,
      usage,
    });
  });
  components.sort((a, b) => a.name.localeCompare(b.name));

  const { variables: allVariables } = getVariableUsage(state, moduleId);
  const relatedVariables = allVariables.filter((v) => v.setBy.length + v.readBy.length > 0);

  return {
    runsOnLoad,
    queries,
    components,
    variables: {
      app: relatedVariables.filter((v) => v.scope === 'app'),
      page: relatedVariables.filter((v) => v.scope === 'page'),
    },
  };
}
