// The editor's action list. Kept in sync by hand with
// frontend/src/AppBuilder/RightSideBar/Inspector/ActionTypes.js — when an action is added there,
// add it here too (and to the remapping blocks listed in
// .github/instructions/event-action-remapping.instructions.md).
export const EVENT_ACTION_IDS = [
  'run-query',
  'reset-query',
  'abort-query',
  'show-alert',
  'control-component',
  'show-modal',
  'close-modal',
  'set-table-page',
  'scroll-component-into-view',
  'switch-page',
  'go-to-app',
  'open-webpage',
  'set-page-variable',
  'unset-page-variable',
  'unset-all-page-variables',
  'set-custom-variable',
  'unset-custom-variable',
  'unset-all-custom-variables',
  'logout',
  'generate-file',
  'set-localstorage-value',
  'copy-to-clipboard',
  'toggle-app-mode',
] as const;

const ACTION_ID_SET = new Set<string>(EVENT_ACTION_IDS);

export function isKnownActionId(actionId: string | undefined): boolean {
  return !!actionId && ACTION_ID_SET.has(actionId);
}

export type ActionEntityKind = 'query' | 'component' | 'page';

export interface ActionEntityRef {
  // The key inside the `event` JSONB that stores the referenced entity's id.
  field: string;
  entity: ActionEntityKind;
}

// Actions whose event JSONB stores a plain UUID reference to another entity. Mirrors the
// remapping tables in versions/services/create.service.ts and app-import-export.service.ts
// (see .github/instructions/event-action-remapping.instructions.md).
export const ACTION_ENTITY_REFS: Record<string, ActionEntityRef> = {
  'run-query': { field: 'queryId', entity: 'query' },
  'reset-query': { field: 'queryId', entity: 'query' },
  'abort-query': { field: 'queryId', entity: 'query' },
  'control-component': { field: 'componentId', entity: 'component' },
  'scroll-component-into-view': { field: 'componentId', entity: 'component' },
  'show-modal': { field: 'modal', entity: 'component' },
  'close-modal': { field: 'modal', entity: 'component' },
  'set-table-page': { field: 'table', entity: 'component' },
  'switch-page': { field: 'pageId', entity: 'page' },
};

// The entity id an event's action points at, e.g. the query a run-query runs.
export function actionEntityRef(
  event: Record<string, any> | undefined
): (ActionEntityRef & { value: unknown }) | undefined {
  const ref = event?.actionId ? ACTION_ENTITY_REFS[event.actionId] : undefined;
  return ref ? { ...ref, value: event[ref.field] } : undefined;
}
