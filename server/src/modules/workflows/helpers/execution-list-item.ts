import { ExecutionListItem, ExecutionListRow } from '../types/execution-list';
import { WORKFLOW_TRIGGER_TYPE } from '../types';
import { describeCadence } from './schedule-cron';

type ScheduleLike = { name?: string | null; type: string; details?: Record<string, unknown> | null } | null | undefined;

/** The schedule's name, or its cadence as the upcoming-runs panel words it. */
export const describeSchedule = (schedule: ScheduleLike): string | null => {
  if (!schedule) return null;
  return schedule.name || describeCadence({ type: schedule.type, details: schedule.details ?? {} });
};

const iso = (value: Date | string | null | undefined): string | null => {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
};

/**
 * Maps a decorated repository row onto the wire shape.
 *
 * Note this returns the raw DB `status` plus `executed`, NOT a display state. The browser derives
 * the display state with `getExecutionDisplayState`, which also needs live BullMQ job state — so
 * resolving it here would produce a second, subtly different status vocabulary that drifts from the
 * editor's logs panel.
 */
export const toExecutionListItem = (row: ExecutionListRow): ExecutionListItem => ({
  id: row.id,
  workflow: row.app ? { id: row.app.id, name: row.app.name } : null,
  status: row.status ?? null,
  executed: !!row.executed,
  triggerType: row.triggerType ?? WORKFLOW_TRIGGER_TYPE.UNKNOWN,
  schedule: row.schedule ? { id: row.schedule.id, name: describeSchedule(row.schedule) } : null,
  startedAt: iso(row.startedAt),
  finishedAt: iso(row.finishedAt),
  createdAt: iso(row.createdAt),
  version: row.appVersion ? { id: row.appVersion.id, name: row.appVersion.name } : null,
  environment: row.environment ? { id: row.environment.id, name: row.environment.name } : null,
});
