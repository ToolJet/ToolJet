import type { EventTarget, UsageDetail, UsageEntryKind } from './types';
import { getComponentName, getQueryName } from './internals';

export const QUERY_EVENT_ACTIONS = new Set(['run-query', 'reset-query', 'abort-query']);

export const COMPONENT_EVENT_TARGETS: Record<string, (action: any) => string | undefined> = {
  'control-component': (action) => action.componentId,
  'show-modal': (action) => action.modal?.id ?? action.modal,
  'close-modal': (action) => action.modal?.id ?? action.modal,
  'set-table-page': (action) => action.table?.id ?? action.table,
  'scroll-component-into-view': (action) => action.componentId,
};

export const VARIABLE_EVENT_TARGETS: Record<string, UsageEntryKind> = {
  'set-custom-variable': 'variable',
  'unset-custom-variable': 'variable',
  'set-page-variable': 'pageVariable',
  'unset-page-variable': 'pageVariable',
};

export function resolveEventTarget(state: any, action: any, moduleId: string): EventTarget {
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

  if (actionId === 'unset-all-custom-variables') {
    return { kind: 'variable', id: null, name: 'all app variables' };
  }
  if (actionId === 'unset-all-page-variables') {
    return { kind: 'pageVariable', id: null, name: 'all page variables' };
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

export function eventDetail(action: any, target: EventTarget): UsageDetail {
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
