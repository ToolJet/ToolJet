export type UsageEntryKind =
  'component' | 'query' | 'variable' | 'pageVariable' | 'global' | 'constant' | 'page' | 'action' | 'unknown';

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

export type EventTarget = { kind: UsageEntryKind; id: string | null; name: string };
