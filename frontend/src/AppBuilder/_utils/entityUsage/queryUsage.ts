import { getQueryCodeAnalyses } from '@/AppBuilder/_utils/scriptAnalysis';
import type { UsageDetail, UsageEntry } from './types';
import {
  addComponentEntry,
  addEntry,
  addQueryEntry,
  addRefEntry,
  componentBindingExpression,
  detailOf,
  getComponentName,
  getEvents,
  getGraph,
  getQueries,
  getQueryName,
  sorted,
} from './internals';
import { QUERY_EVENT_ACTIONS, resolveEventTarget } from './eventTargets';
import { getQueryRefs } from './queryRefs';

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
      });
    });
  }

  const queries = getQueries(state, moduleId);

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
    if (evt?.target !== 'page' || evt?.sourceId !== currentPageId) return;

    if (QUERY_EVENT_ACTIONS.has(action.actionId) && action.queryId) {
      const name = getQueryName(state, action.queryId, moduleId) ?? action.queryName;
      if (name) addEntry(pageLoad, 'query', action.queryId, name, detailOf('every visit to this page'));
      else addEntry(pageLoad, 'unknown', action.queryId, 'Unknown query', detailOf('every visit to this page'));
      return;
    }

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
