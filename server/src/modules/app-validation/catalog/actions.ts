// Event actions and targets, read from events.json - the server copy of the editor's
// action list (frontend ActionTypes.js). The frontend parity spec keeps the JSON honest;
// the remapping blocks listed in .github/instructions/event-action-remapping.instructions.md
// must gain an entry whenever an action that stores a plain UUID is added.
import * as eventsCatalog from './events.json';

export const EVENT_ACTION_IDS: readonly string[] = eventsCatalog.actionIds;

const ACTION_ID_SET = new Set<string>(EVENT_ACTION_IDS);

export const EVENT_TARGETS: readonly string[] = eventsCatalog.targets;

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
export const ACTION_ENTITY_REFS: Record<string, ActionEntityRef> = eventsCatalog.actionEntityRefs as Record<
  string,
  ActionEntityRef
>;

// The entity id an event's action points at, e.g. the query a run-query runs.
export function actionEntityRef(
  event: Record<string, any> | undefined
): (ActionEntityRef & { value: unknown }) | undefined {
  const ref = event?.actionId ? ACTION_ENTITY_REFS[event.actionId] : undefined;
  return ref ? { ...ref, value: event[ref.field] } : undefined;
}
