import { getQueryCodeAnalyses } from '@/AppBuilder/_utils/scriptAnalysis';
import type { UsageDetail, UsageEntry } from './types';
import {
  PARAM_TYPES,
  addComponentEntry,
  addEntry,
  addQueryEntry,
  addSourceNodeEntry,
  componentBindingExpression,
  detailOf,
  getComponentName,
  getEvents,
  getGraph,
  getQueries,
  getQueryName,
  sorted,
} from './internals';
import { COMPONENT_EVENT_TARGETS, eventDetail, resolveEventTarget } from './eventTargets';
import { getQueryRefs } from './queryRefs';

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
        const property = parts.slice(3).join('.');
        const expression = componentBindingExpression(state, moduleId, componentId, parts[2], property);
        graph.getDirectDependents(node).forEach((source: string) => {
          if (source === basePath || source.startsWith(`${basePath}.`)) return;
          addSourceNodeEntry(state, moduleId, uses, source, detailOf(property, expression));
        });
      } else if (parts.length === 3) {
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
        });
      }
    });
  }

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

  getEvents(state, moduleId).forEach((evt: any) => {
    const action = evt?.event;
    if (!action) return;

    if (evt?.sourceId === componentId) {
      const target = resolveEventTarget(state, action, moduleId);
      if (target.kind === 'component' && target.id === componentId) return;
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
